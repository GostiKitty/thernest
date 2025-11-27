// src/core/climate.js

// Очень упрощённая климатическая база для РФ.
// При необходимости можно расширять новыми городами.
const CLIMATE_DB = [
  {
    key: "moscow",
    names: ["москва", "moscow", "moskva"],
    Tdesign: -26,
    HDD: 5400,       // градусо-дни отопительного периода
    TavgYear: 5,
    Aseason: 18,
  },
  {
    key: "spb",
    names: ["санкт-петербург", "питер", "spb", "saint petersburg"],
    Tdesign: -24,
    HDD: 5000,
    TavgYear: 4,
    Aseason: 17,
  },
  {
    key: "kazan",
    names: ["казань", "kazan"],
    Tdesign: -29,
    HDD: 5600,
    TavgYear: 3,
    Aseason: 19,
  },
  {
    key: "ekb",
    names: ["екатеринбург", "екб", "yekaterinburg"],
    Tdesign: -31,
    HDD: 5800,
    TavgYear: 2,
    Aseason: 20,
  },
  {
    key: "novosibirsk",
    names: ["новосибирск", "novosibirsk"],
    Tdesign: -32,
    HDD: 6200,
    TavgYear: 1,
    Aseason: 21,
  },
];

// поиск климата по городу
export function getClimateRecord(cityRaw) {
  const city = (cityRaw || "").toLowerCase().trim();

  if (!city) {
    return CLIMATE_DB[0]; // Москва по умолчанию
  }

  for (const rec of CLIMATE_DB) {
    if (rec.names.some((n) => city.includes(n))) {
      return rec;
    }
  }

  return CLIMATE_DB[0];
}

// Данные для расчётной точки и годового расчёта
export function getClimateDesignData(cityRaw, winterType, uncertainty) {
  const base = getClimateRecord(cityRaw);
  let Tdesign = base.Tdesign;

  const wt = (winterType || "").toLowerCase();

  if (wt.includes("холод")) Tdesign -= 3;
  if (wt.includes("аном")) Tdesign -= 5;

  const u = parseFloat((uncertainty || "0").toString().replace(",", "."));
  if (Number.isFinite(u) && u > 0) Tdesign -= u;

  // грубо: часы отопления ~ HDD * 24 / 20К температурной разности
  const hoursHeating = Math.round((base.HDD * 24) / 20);

  return {
    ...base,
    Tdesign,
    hoursHeating,
  };
}

// Почасовой климат на год (8760 точек): синус по году + суточные колебания
export function getHourlyClimate(cityRaw) {
  const base = getClimateRecord(cityRaw);
  const N = 8760;
  const result = [];

  const Tavg = base.TavgYear;
  const A = base.Aseason;

  for (let i = 0; i < N; i++) {
    const dayFloat = i / 24;
    const day = Math.floor(dayFloat) + 1;
    const hour = i % 24;

    // сезонная составляющая — минимум примерно в январе
    const season =
      A * Math.sin(((2 * Math.PI * (dayFloat - 20)) / 365)); // сдвиг по фазе

    // суточные колебания: максимум ближе к 15 часам
    const diurnal = 3 * Math.sin(((2 * Math.PI * (hour - 15)) / 24));

    const T = Tavg + season + diurnal;

    result.push({
      index: i,
      day,
      hour,
      T: Number(T.toFixed(1)),
    });
  }

  return result;
}
