// src/core/improvements.js
import { computeEnergyModel } from "./energyModel";
import { payback } from "./economy";

export const IMPROVEMENTS = [
  {
    key: "wall_50",
    name: "Добавить 50 мм утеплителя на стены",
    cost: 1500 * 100, // руб/м² * условная площадь
    apply: (data) => ({
      ...data,
      wallDescription: data.wallDescription + " + минвата 50мм",
    }),
  },
  {
    key: "wall_100",
    name: "Добавить 100 мм утеплителя на стены",
    cost: 2000 * 100,
    apply: (data) => ({
      ...data,
      wallDescription: data.wallDescription + " + минвата 100мм",
    }),
  },
  {
    key: "windows_eff",
    name: "Замена окон на энергоэффективные",
    cost: 25000,
    apply: (data) => ({ ...data, windowTypeKey: "std_3ch" }),
  },
  {
    key: "airtight",
    name: "Герметизация окон и швов",
    cost: 12000,
    apply: (data) => ({ ...data, infiltration: "0.3" }),
  },
  {
    key: "recuperator",
    name: "Установка рекуператора",
    cost: 90000,
    apply: (data) => ({ ...data, infiltration: "0.1" }),
  },
  {
    key: "bio_wall",
    name: "Био-стена (зелёный фасад)",
    cost: 150000,
    apply: (data) => ({ ...data, wallDescription: data.wallDescription + " + биопанель 40мм" }),
  },
];

export function evaluateImprovements(data) {
  const base = computeEnergyModel(data);
  const results = [];

  for (const imp of IMPROVEMENTS) {
    const modified = imp.apply(data);
    const after = computeEnergyModel(modified);

    const deltaQ = base.Qdesign - after.Qdesign;

    const econ = payback(deltaQ, imp.cost, base.climate.hoursHeating);

    results.push({
      improvement: imp,
      deltaQ,
      annualSaving: econ.annualSavingRub,
      paybackYears: econ.paybackYears,
      modifiedData: modified,
    });
  }

  results.sort((a, b) => a.paybackYears - b.paybackYears);

  return results;
}
