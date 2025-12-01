// src/core/economy.js

// Базовые тарифы (руб/кВт·ч или руб/кВт·ч в пересчёте)
export const TARIFFS = {
  electric_single: 6.0, // простой одноставочный
  electric_day: 6.5,
  electric_night: 3.0,
  gas: 1.8, // условно: руб/кВт·ч тепла от газа
  district: 2.5, // тепло от ЦТП/ТЭЦ
};

// КПД / COP для разных систем отопления
const HEATING_EFF = {
  electric: 1.0,
  gas: 0.9,
  district: 0.95,
  hpump: 3.0, // тепловой насос, COP≈3
};

/**
 * Экономика эксплуатации
 * @param {number} Eyear_kWh - годовое потребление тепла, кВт·ч
 * @param {object} options
 *   - heatingType: "electric" | "gas" | "district" | "hpump"
 */
export function computeEconomy(Eyear_kWh, options = {}) {
  const heatingType = options.heatingType || "electric";

  const eff = HEATING_EFF[heatingType] ?? HEATING_EFF.electric;
  const delivered_kWh = Eyear_kWh / (eff || 1); // сколько энергии "из сети/котла"

  let tariff;
  let meta;

  switch (heatingType) {
    case "gas":
      tariff = TARIFFS.gas;
      meta = {
        label: "Газовый котёл",
        description:
          "Классический индивидуальный газовый котёл. Учитывается КПД котла и стоимость газа в пересчёте на кВт·ч тепла.",
      };
      break;

    case "district":
      tariff = TARIFFS.district;
      meta = {
        label: "Центральное теплоснабжение",
        description:
          "Тепло от городской котельной или ТЭЦ. Стоимость зависит от местных тарифов на ГВС/отопление.",
      };
      break;

    case "hpump":
      tariff = TARIFFS.electric_single;
      meta = {
        label: "Тепловой насос",
        description:
          "Тепловой насос с высоким COP. Электроэнергия умножается на коэффициент преобразования.",
      };
      break;

    default:
      tariff = TARIFFS.electric_single;
      meta = {
        label: "Электроотопление",
        description:
          "Простое электрическое отопление (ТЭНы, конвекторы, тёплый пол).",
      };
  }

  const annualCost = delivered_kWh * tariff;

  const byTariff = {
    electric_single: Eyear_kWh * TARIFFS.electric_single,
    dayNight: {
      dayCost: Eyear_kWh * 0.7 * TARIFFS.electric_day,
      nightCost: Eyear_kWh * 0.3 * TARIFFS.electric_night,
    },
    gas: Eyear_kWh * TARIFFS.gas,
    district: Eyear_kWh * TARIFFS.district,
  };

  // Оценка расхода энергоносителя (для подсказок)
  const gasHeatValue = 9.0; // кВт·ч/м³
  const boilerEfficiency = 0.9;

  const gas_m3 =
    heatingType === "gas"
      ? delivered_kWh / (gasHeatValue * boilerEfficiency)
      : 0;

  return {
    annualCost,
    monthlyCost: annualCost / 12,
    delivered_kWh,
    byTariff,
    meta,
    heatingType,
    assumptions: {
      eff,
      gasHeatValue,
      boilerEfficiency,
    },
    carrier: {
      gas_m3,
    },
  };
}

// Анализ окупаемости "улучшения" по ∆Q
export function payback(deltaQ_W, cost, heatingHours = 5000) {
  const annualSaving_kWh = (deltaQ_W * heatingHours) / 1000;
  const annualSavingRub =
    annualSaving_kWh * TARIFFS.electric_single;

  const paybackYears =
    annualSavingRub > 0 ? cost / annualSavingRub : Infinity;

  return {
    annualSaving_kWh,
    annualSavingRub,
    paybackYears,
  };
}
