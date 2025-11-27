//--------------------------------------------------------
// ПОДСКАЗКИ ДЛЯ ПОЛЕЙ ВВОДА
//--------------------------------------------------------

export const SUGGEST_MATERIALS = [
  "кирпич 380мм",
  "кирпич 510мм",
  "газобетон 300мм",
  "газобетон 400мм",
  "керамзитобетон 400мм",
  "ЖБ панель 160мм",
  "ЖБ панель 300мм",
  "каркас 150мм минвата",
  "каркас 200мм минвата",
  "минвата 100мм",
  "минвата 150мм",
  "пенополистирол 100мм",
  "пенополистирол 150мм",
  "гипсокартон 12мм",
  "штукатурка 20мм",
];

export const SUGGEST_WINDOWS = [
  "двухкамерный стеклопакет",
  "трехкамерный стеклопакет",
  "ПВХ стандарт",
  "ПВХ энергосберегающие",
  "деревянные окна",
  "алюминиевые теплые",
  "алюминиевые холодные",
  "стекло Low-E",
  "солнецезащитное стекло",
];

//--------------------------------------------------------
// БАЗА МАТЕРИАЛОВ
//--------------------------------------------------------

export const MATERIALS = {
  "кирпич": { lambda: 0.75 },
  "керамзитобетон": { lambda: 0.43 },
  "газобетон": { lambda: 0.12 },
  "минвата": { lambda: 0.042 },
  "пенополистирол": { lambda: 0.035 },
  "бетон": { lambda: 1.70 },
  "железобетон": { lambda: 2.04 },
  "штукатурка": { lambda: 0.70 },
  "гкл": { lambda: 0.25 },
  "гипс": { lambda: 0.35 },
};

//--------------------------------------------------------
// ГОТОВЫЕ КОНСТРУКЦИИ
//--------------------------------------------------------

export const CONSTRUCTIONS = {
  "brick_380_mw100": {
    description: "Кирпич 380 мм + Минвата 100 мм",
    layers: [
      { name: "кирпич", d: 0.38 },
      { name: "минвата", d: 0.10 },
      { name: "штукатурка", d: 0.02 },
    ],
  },

  "panel_300": {
    description: "ЖБ панель 300 мм",
    layers: [
      { name: "железобетон", d: 0.30 },
      { name: "штукатурка", d: 0.02 },
    ],
  },

  "aerated_300": {
    description: "Газобетон 300 мм + штукатурка 20 мм",
    layers: [
      { name: "газобетон", d: 0.30 },
      { name: "штукатурка", d: 0.02 },
    ],
  },

  "frame_insulated": {
    description: "Каркас + утепление 150 мм",
    layers: [
      { name: "гкл", d: 0.013 },
      { name: "минвата", d: 0.15 },
      { name: "гипс", d: 0.02 },
    ],
  },
};

//--------------------------------------------------------
// ПАРСЕР ТЕКСТОВОЙ СТЕНЫ
//--------------------------------------------------------

function parseLayerPhrase(text) {
  const tokens = text.trim().toLowerCase().split(/\s+/);

  let name = null;
  let thickness = null;

  for (let t of tokens) {
    if (MATERIALS[t]) name = t;

    const mm = t.replace("мм", "");
    if (!isNaN(parseFloat(mm))) {
      thickness = parseFloat(mm) / 1000;
    }
  }

  if (name && thickness) return { name, d: thickness };
  return null;
}

export function parseWallText(txt) {
  if (!txt) return [];

  const parts = txt.split(/[,+]/).map((s) => s.trim());

  const layers = [];
  for (const p of parts) {
    const layer = parseLayerPhrase(p);
    if (layer) layers.push(layer);
  }
  return layers;
}

//--------------------------------------------------------
// U-ЗНАЧЕНИЕ СТЕНЫ
//--------------------------------------------------------

export function calcUFromLayers(layers) {
  if (!layers || layers.length === 0) return 1.5;

  let R = 0;
  for (const l of layers) {
    const mat = MATERIALS[l.name];
    if (!mat) continue;
    R += l.d / mat.lambda;
  }

  const Rsi = 0.13;
  const Rse = 0.04;
  return 1 / (R + Rsi + Rse);
}

//--------------------------------------------------------
// СБОРКА СТЕНЫ
//--------------------------------------------------------

export function resolveWallFromData({ constructionKey, wallDescription }) {
  if (constructionKey && CONSTRUCTIONS[constructionKey]) {
    const c = CONSTRUCTIONS[constructionKey];
    return {
      layers: c.layers,
      Uwall: calcUFromLayers(c.layers),
      description: c.description,
    };
  }

  if (wallDescription) {
    const layers = parseWallText(wallDescription);
    return {
      layers,
      Uwall: calcUFromLayers(layers),
      description: wallDescription,
    };
  }

  return { layers: [], Uwall: 1.5, description: "" };
}

//--------------------------------------------------------
// ТИПЫ ОКОН
//--------------------------------------------------------

export const WINDOW_TYPES = [
  {
    key: "std_2ch",
    name: "2-камерный стеклопакет",
    Uw: 1.2,
    gValue: 0.55,
    psi: 0.06,
  },
  {
    key: "std_3ch",
    name: "3-камерный энергосберегающий",
    Uw: 0.9,
    gValue: 0.48,
    psi: 0.05,
  },
  {
    key: "old_wood",
    name: "Старые деревянные",
    Uw: 2.6,
    gValue: 0.65,
    psi: 0.08,
  },
];

export function getWindowTypeForData(data) {
  if (!data.windowTypeKey) return WINDOW_TYPES[0];
  return WINDOW_TYPES.find((w) => w.key === data.windowTypeKey) || WINDOW_TYPES[0];
}

//--------------------------------------------------------
// ТИПОВЫЕ ЗДАНИЯ
//--------------------------------------------------------

export const ARCHETYPES = [
  {
    key: "p44_panel",
    name: "Панельный дом П-44 (9 этажей)",
    defaults: {
      floors: 9,
      area: 450,
      height: 2.7,
      constructionKey: "panel_300",
      windowTypeKey: "std_2ch",
      windowArea: 45,
      infiltration: 0.5,
    },
  },
  {
    key: "khrushchev",
    name: "Кирпичная пятиэтажка",
    defaults: {
      floors: 5,
      area: 350,
      height: 2.5,
      constructionKey: "brick_380_mw100",
      windowTypeKey: "std_2ch",
      windowArea: 35,
      infiltration: 0.7,
    },
  },
  {
    key: "aerated_house",
    name: "Газобетонный дом (2 этажа)",
    defaults: {
      floors: 2,
      area: 160,
      height: 2.8,
      constructionKey: "aerated_300",
      windowTypeKey: "std_3ch",
      windowArea: 24,
      infiltration: 0.4,
    },
  },
  {
    key: "frame_house",
    name: "Каркасный дом (2 этажа)",
    defaults: {
      floors: 2,
      area: 140,
      height: 2.6,
      constructionKey: "frame_insulated",
      windowTypeKey: "std_3ch",
      windowArea: 22,
      infiltration: 0.5,
    },
  },
];

//--------------------------------------------------------
// ПРИМЕНЕНИЕ ТИПОВОГО ДОМА
//--------------------------------------------------------

export function applyArchetypeDefaults(key, prev) {
  const arch = ARCHETYPES.find((a) => a.key === key);
  if (!arch) return prev;

  return {
    ...prev,
    archetypeKey: key,
    ...arch.defaults,
    wallDescription: CONSTRUCTIONS[arch.defaults.constructionKey]?.description,
  };
}
