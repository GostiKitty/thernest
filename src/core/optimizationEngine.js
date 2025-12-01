// src/core/optimizationEngine.js
import { computeEnergyModel } from "./energyModel";

export function computeImprovements(data) {
  const base = computeEnergyModel(data);
  const tariff = 6; // руб/кВт·ч

  const areaNum = parseFloat(data.area || 0) || 0;
  const areaWall = 0.7 * areaNum;
  const areaWindow = parseFloat(data.windowArea || 0) || 0;

  const variants = [];

  // 1) Утепление +50 мм
  variants.push({
    name: "Утепление стен +50 мм",
    cost: areaWall * 950,
    mod: { addWallInsulation: 0.05 },
  });

  // 2) Утепление +100 мм
  variants.push({
    name: "Утепление стен +100 мм",
    cost: areaWall * 1400,
    mod: { addWallInsulation: 0.1 },
  });

  // 3) Окна → Low-E
  variants.push({
    name: "Окна 3-камерные Low-E",
    cost: areaWindow * 6000,
    mod: { windowUpgrade: "std_3ch" },
  });

  // 4) Снижение инфильтрации −0.2 ACH
  variants.push({
    name: "Герметизация (−0.2 ACH)",
    cost: 20000,
    mod: { infiltrationDelta: -0.2 },
  });

  // 5) Рекуператор 80%
  variants.push({
    name: "Рекуперация 80%",
    cost: 120000,
    mod: { ventilationRecuperation: 0.8 },
  });

  // 6) Термоголовки TRV
  variants.push({
    name: "Умные термоголовки TRV",
    cost: 15000,
    mod: { trv: true },
  });

  // 7) Ночной экономичный режим
  variants.push({
    name: "Ночной экономичный режим",
    cost: 0,
    mod: { nightSchedule: true },
  });

  const evaluated = variants.map((v) => {
    const modified = { ...data };

    if (v.mod.addWallInsulation) {
      modified.additionalInsulation = v.mod.addWallInsulation;
    }

    if (v.mod.windowUpgrade) {
      modified.windowTypeKey = v.mod.windowUpgrade;
    }

    if (typeof v.mod.infiltrationDelta === "number") {
      const baseInf = parseFloat(data.infiltration || 0.6) || 0.6;
      modified.infiltration = Math.max(0.1, baseInf + v.mod.infiltrationDelta);
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

  const sorted = evaluated
    .filter((v) => v.payback !== Infinity)
    .sort((a, b) => a.payback - b.payback);

  return sorted.slice(0, 5);
}
