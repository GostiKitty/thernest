// src/core/monteCarlo.js
import { computeEnergyModel } from "./energyModel";

function randNorm(mean, sigma) {
  let u = Math.random() || 0.0001;
  let v = Math.random() || 0.0001;
  return mean + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function runMonteCarlo(data, count = 500) {
  const results = [];

  for (let i = 0; i < count; i++) {
    const d = { ...data };

    d.tempInside = randNorm(data.tempInside, 0.5); // разброс внутренней температуры ±0.5°C
    d.height = randNorm(data.height, 0.05);         // высота ±5 см
    d.area = randNorm(data.area, data.area * 0.03); // ±3%
    d.infiltration = randNorm(0.5, 0.15);           // инфильтрация ±0.15
    d.uncertainty = randNorm(data.uncertainty, 1);  // разброс климата ±1°C

    const model = computeEnergyModel(d);

    results.push({
      Qdesign: model.Qdesign,
      Qmin: model.Qmin,
      Qmax: model.Qmax,
      Eyear: model.Eyear_kWh,
    });
  }

  results.sort((a, b) => a.Qdesign - b.Qdesign);

  return {
    raw: results,
    p10: results[Math.floor(results.length * 0.10)],
    p50: results[Math.floor(results.length * 0.50)],
    p90: results[Math.floor(results.length * 0.90)],
  };
}
