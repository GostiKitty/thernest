// src/core/economy.js

// Тарифы (руб/кВт·ч)
export const TARIFFS = {
  default: 6.0,
  night: 3.0,
  day: 6.5,
};

// ЭКСПЛУАТАЦИОННАЯ ЭКОНОМИКА
export function computeEconomy(Eyear_kWh, tariff = TARIFFS.default) {
  const annualCost = Eyear_kWh * tariff;

  return {
    annualCost,
    monthlyCost: annualCost / 12,
    byTariff: {
      default: Eyear_kWh * TARIFFS.default,
      dayNight: {
        dayCost: 0.7 * Eyear_kWh * TARIFFS.day,
        nightCost: 0.3 * Eyear_kWh * TARIFFS.night,
      },
    },
  };
}

// АНАЛИЗ ОКУПАЕМОСТИ
export function payback(deltaQ_W, cost, heatingHours = 5000) {
  const annualSaving_kWh = (deltaQ_W * heatingHours) / 1000;

  const annualSavingRub = annualSaving_kWh * TARIFFS.default;

  const paybackYears = cost / (annualSavingRub || 1);

  return {
    annualSaving_kWh,
    annualSavingRub,
    paybackYears,
  };
}
