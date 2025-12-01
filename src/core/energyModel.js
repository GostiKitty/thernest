// src/core/energyModel.js

import { describeWallFromInput } from "./uvalue";
import {
  infiltrationHeatLoss,
  ventilationHeatLoss,
} from "./infiltration";
import { computeSolarGains } from "./solar";
import { computeCondensationRisk } from "./riskCondensation";

import { getWindowTypeForData } from "../data/buildingDB";
import {
  getClimateDesignData,
  getHourlyClimate,
} from "./climate";

// ----------------------------------------------------
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ----------------------------------------------------

function normNum(val, def) {
  const n =
    typeof val === "string"
      ? parseFloat(val.replace(",", "."))
      : Number(val);
  return Number.isFinite(n) ? n : def;
}

// Внутренние теплопритоки (Вт/м²) — по описанию эксплуатации
function internalGainSpecific(data) {
  const occ = (data.occupancy || "").toLowerCase();
  const app = (data.appliances || "").toLowerCase();

  let q = 3; // базовый уровень, Вт/м²

  if (occ.includes("выход") || occ.includes("всегда")) q += 2;
  if (occ.includes("вечер")) q += 1;

  if (app.includes("выс")) q += 4;
  if (app.includes("низ")) q -= 1;

  if (q < 0) q = 0;
  return q;
}

// Гауссовский случайный множитель для Монте-Карло
function randFactor(sigma) {
  const u = Math.random() || 1e-6;
  const v = Math.random() || 1e-6;
  const z =
    Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return 1 + z * sigma;
}

// ----------------------------------------------------
// ОСНОВНАЯ МОДЕЛЬ: РАСЧЁТ ТЕПЛОВОЙ НАГРУЗКИ И ГОДОВОГО ЭНЕРГОПОТРЕБЛЕНИЯ
// ----------------------------------------------------

export function computeEnergyModel(data) {
  // Геометрия
  const floors = normNum(data.floors, 1);
  const area = normNum(data.area, 100);
  const height = normNum(data.height, 2.7);
  const tempInside = normNum(data.tempInside, 22);
  const uncertainty = normNum(data.uncertainty, 0);

  const volume = area * floors * height;

  // Оценка внешней площади стен (shape factor)
  const shapeFactor = 2.6; // типично для многоквартирных/рядовых домов
  const wallArea = shapeFactor * area;

  // Стены: слои + U-value из нашего Physics Engine
  const wallResolved = describeWallFromInput({
    constructionKey: data.constructionKey,
    wallDescription: data.wallDescription || data.wallMaterial,
  });
  const Uwall = wallResolved.Uwall;

  // Окна
  const windowArea = normNum(
    data.windowArea,
    area * 0.2 // по умолчанию 20% остекления
  );
  const winType = getWindowTypeForData(data);
  const Uw = winType.Uw ?? 1.2;
  const gValue = winType.gValue ?? 0.5;

  // Климат и расчётная температура наружного воздуха
  const climate = getClimateDesignData(
    data.city,
    data.winterType,
    data.uncertainty
  );
  const Tdesign = climate.Tdesign;
  const T_inside = tempInside;
  const dT = T_inside - Tdesign || 0.0001; // защищаемся от нуля

  // -------------------------------------
  // СОСТАВЛЯЮЩИЕ ТЕПЛОВОГО БАЛАНСА
  // -------------------------------------

  // 1) Теплопотери через стены и окна
  const Qwalls = Uwall * wallArea * dT;
  const Qtrans_win = Uw * windowArea * dT;

  // 2) Инфильтрация и вентиляция (из Physics Engine)
  const windSpeed = normNum(data.wind, 3);
  const Qinf = infiltrationHeatLoss({
    volume,
    dT,
    userACH: data.infiltration,
    tightness: data.tightness,
    windSpeed,
    floors,
  });

  const Qvent = ventilationHeatLoss({
    volume,
    dT,
    occupancy: data.occupancy,
  });

  // 3) Солнечные теплопритоки (очень упрощённые)
  const Qsolar = computeSolarGains({
    windowArea,
    gValue,
    orientation: data.orientation,
    shadingFactor: data.shadingFactor,
    climateKey: climate.key,
    season: "winter",
  });

  // 4) Внутренние теплопритоки (люди + техника)
  const q_int = internalGainSpecific(data); // Вт/м²
  const Qinternal = q_int * area;

  // Итоговая расчётная нагрузка
  const Qdesign =
    Qwalls + Qtrans_win + Qinf + Qvent - Qsolar - Qinternal;

  // Диапазон с учётом неопределённости по температуре
  let Qmin = Qdesign;
  let Qmax = Qdesign;
  if (uncertainty > 0) {
    const dTmin = dT - uncertainty;
    const dTmax = dT + uncertainty;
    const k = Qdesign / dT;

    Qmin = k * dTmin;
    Qmax = k * dTmax;
  }

  // Годовое потребление по HDD-методу
  const k_tot = Qdesign / dT; // Вт/К
  const Eyear_kWh = (k_tot * climate.HDD * 24) / 1000;

  // -------------------------------------
  // КРИВАЯ Q(T)
  // -------------------------------------

  const curveData = [];
  for (let T = 5; T >= Tdesign - 5; T -= 1) {
    const dTloc = T_inside - T;
    const Qloc = k_tot * dTloc;

    let QminLoc = Qloc;
    let QmaxLoc = Qloc;
    if (uncertainty > 0) {
      QminLoc = k_tot * (dTloc - uncertainty);
      QmaxLoc = k_tot * (dTloc + uncertainty);
    }

    curveData.push({
      T,
      Q: Math.max(0, Qloc),
      Qmin: Math.max(0, QminLoc),
      Qmax: Math.max(0, QmaxLoc),
    });
  }

  // -------------------------------------
  // СУТОЧНЫЙ ПРОФИЛЬ (УСЛОВНЫЙ ЗИМНИЙ ДЕНЬ)
  // -------------------------------------

  const dailyData = [];
  const occ = (data.occupancy || "").toLowerCase();

  for (let hour = 0; hour < 24; hour++) {
    let factor = 1;

    if (occ.includes("вечер")) {
      factor = hour >= 18 && hour <= 23 ? 1.0 : 0.7;
    } else if (occ.includes("ноч") || occ.includes("смен")) {
      factor = hour >= 22 || hour < 6 ? 1.0 : 0.7;
    } else if (
      occ.includes("всегда") ||
      occ.includes("дом") ||
      occ.includes("круглосуточ")
    ) {
      factor = 1.0;
    } else {
      factor = hour >= 7 && hour <= 23 ? 1.0 : 0.6;
    }

    dailyData.push({
      hour,
      Q: Math.max(0, Qdesign * factor),
    });
  }

  // -------------------------------------
  // РИСК КОНДЕНСАЦИИ И ПЛЕСЕНИ
  // -------------------------------------

  const condRisk = computeCondensationRisk({
    T_inside: T_inside,
    T_out: Tdesign,
    RH_inside: normNum(data.RH_inside, 50),
    Uwall,
  });

  return {
    climate,
    Tdesign,
    T_inside,
    uncert: uncertainty,
    Qdesign,
    Qmin,
    Qmax,
    Eyear_kWh,
    designRes: {
      parts: {
        Qwalls,
        Qtrans_win,
        Qinf,
        Qvent,
        Qsolar,
        Qinternal,
      },
      Uwall,
      Uw,
      wallResolved,
    },
    curveData,
    dailyData,
    wallResolved,
    winType,
    wallArea,
    windowArea,
    volume,
    condRisk,
  };
}

// ----------------------------------------------------
// ПОЧАСОВАЯ МОДЕЛЬ ДЛЯ 8760 ЧАСОВ
// ----------------------------------------------------

export function computeHourlyLoad(data) {
  const model = computeEnergyModel(data);
  const climateHours = getHourlyClimate(data.city);

  const k_tot =
    model.T_inside - model.Tdesign === 0
      ? 0
      : model.Qdesign /
        (model.T_inside - model.Tdesign || 0.0001);

  const hourly = climateHours.map((pt) => {
    const dT = model.T_inside - pt.T;
    const Q = Math.max(0, k_tot * dT);
    return Q;
  });

  return hourly;
}

// ----------------------------------------------------
// МОНТЕ-КАРЛО: АНАЛИЗ НЕОПРЕДЕЛЁННОСТИ
// ----------------------------------------------------

export function monteCarloSim(data, nSamples = 500) {
  const res = [];

  for (let i = 0; i < nSamples; i++) {
    const d = { ...data };

    d.area = normNum(data.area, 100) * randFactor(0.05);
    d.floors = normNum(data.floors, 1) * randFactor(0.05);
    d.height = normNum(data.height, 2.7) * randFactor(0.03);

    d.windowArea =
      normNum(
        data.windowArea,
        normNum(data.area, 100) * 0.2
      ) * randFactor(0.15);

    d.infiltration =
      normNum(data.infiltration, 0.5) * randFactor(0.4);
    d.wind = normNum(data.wind, 3) * randFactor(0.3);

    d.tempInside =
      normNum(data.tempInside, 22) * randFactor(0.01);
    d.uncertainty =
      normNum(data.uncertainty, 3) * randFactor(0.5);

    const m = computeEnergyModel(d);
    res.push({
      T: m.Tdesign,
      Q: m.Qdesign,
    });
  }

  return res;
}
