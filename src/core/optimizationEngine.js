import { computeEnergyModel } from "./energyModel";

export function computeImprovements(data) {
  const base = computeEnergyModel(data);
  const tariff = 6; // руб/кВт·ч
  const areaWall = 0.7 * data.area; // приближение площади стен
  const areaWindow = parseFloat(data.windowArea || 0);

  const variants = [];

  //----------------------------------------------------
  // 1) Утепление +50 мм
  //----------------------------------------------------
  variants.push({
    name: "Утепление стен +50 мм",
    cost: areaWall * 950, // ₽
    mod: { addWallInsulation: 0.05 },
  });

  //----------------------------------------------------
  // 2) Утепление +100 мм
  //----------------------------------------------------
  variants.push({
    name: "Утепление стен +100 мм",
    cost: areaWall * 1400,
    mod: { addWallInsulation: 0.1 },
  });

  //----------------------------------------------------
  // 3) Окна → Low-E
  //----------------------------------------------------
  variants.push({
    name: "Окна 3-камерные Low-E",
    cost: areaWindow * 6000,
    mod: { windowUpgrade: "std_3ch" },
  });

  //----------------------------------------------------
  // 4) Снижение инфильтрации −0.2 ACH
  //----------------------------------------------------
  variants.push({
    name: "Герметизация (−0.2 ACH)",
    cost: 20000,
    mod: { infiltrationDelta: -0.2 },
  });

  //----------------------------------------------------
  // 5) Рекуператор 80%
  //----------------------------------------------------
  variants.push({
    name: "Рекуперация 80%",
    cost: 120000,
    mod: { ventilationRecuperation: 0.80 },
  });

  //----------------------------------------------------
  // 6) Термоголовки TRV
  //----------------------------------------------------
  variants.push({
    name: "Умные термоголовки TRV",
    cost: 15000,
    mod: { trv: true },
  });

  //----------------------------------------------------
  // 7) Ночное снижение температуры
  //----------------------------------------------------
  variants.push({
    name: "Ночной экономичный режим",
    cost: 0,
    mod: { nightSchedule: true },
  });

  //----------------------------------------------------
  // Теперь считаем каждый вариант
  //----------------------------------------------------

  const evaluated = variants.map((v) => {
    const modified = { ...data };

    // applied modifications
    if (v.mod.addWallInsulation) {
      modified.additionalInsulation = v.mod.addWallInsulation;
    }

    if (v.mod.windowUpgrade) {
      modified.windowTypeKey = v.mod.windowUpgrade;
    }

    if (v.mod.infiltrationDelta) {
      modified.infiltration =
        Math.max(0.1, (parseFloat(data.infiltration) || 0.6) + v.mod.infiltrationDelta);
    }

    if (v.mod.ventilationRecuperation) {
      modified.recuperation = v.mod.ventilationRecuperation;
    }

    if (v.mod.trv) {
      modified.trv = true;
    }

    if (v.mod.nightSchedule) {
      modified.nightSchedule = true;
    }

    const improved = computeEnergyModel(modified);

    const saving_kWh = Math.max(0, base.Eyear_kWh - improved.Eyear_kWh);
    const savingRub = saving_kWh * tariff;

    const payback = savingRub > 0 ? v.cost / savingRub : Infinity;

    return {
      ...v,
      saving_kWh,
      savingRub,
      payback,
    };
  });

  //----------------------------------------------------
  // Сортируем по окупаемости (меньше → лучше)
  //----------------------------------------------------
  const sorted = evaluated
    .filter((v) => v.payback !== Infinity)
    .sort((a, b) => a.payback - b.payback);

  //----------------------------------------------------
  // Возвращаем только ТОП-5
  //----------------------------------------------------
  return sorted.slice(0, 5);
}
