// src/core/energyModel.js

import {
  resolveWallFromData,
  getWindowTypeForData,
} from "../data/buildingDB";
import {
  getClimateDesignData,
  getHourlyClimate,
} from "./climate";

function normNum(val, def) {
  const n =
    typeof val === "string"
      ? parseFloat(val.replace(",", "."))
      : Number(val);
  return Number.isFinite(n) ? n : def;
}

function guessInfiltration(tightnessTxt) {
  const t = (tightnessTxt || "").toLowerCase();
  if (t.includes("низ")) return 0.8;
  if (t.includes("выс")) return 0.3;
  if (t.includes("гермет")) return 0.25;
  return 0.5; // среднее значение ACH
}

function internalGainSpecific(data) {
  const occ = (data.occupancy || "").toLowerCase();
  const app = (data.appliances || "").toLowerCase();

  let q = 3; // базовые внутренние теплопритоки, Вт/м²

  if (occ.includes("выход") || occ.includes("всегда")) q += 2;
  if (occ.includes("вечер")) q += 1;

  if (app.includes("выс")) q += 4;
  if (app.includes("низ")) q -= 1;

  if (q < 0) q = 0;
  return q;
}

// ----- ГЛАВНАЯ ФУНКЦИЯ РАСЧЁТА -----

export function computeEnergyModel(data) {
  const floors = normNum(data.floors, 1);
  const area = normNum(data.area, 100);
  const height = normNum(data.height, 2.7);
  const tempInside = normNum(data.tempInside, 22);
  const uncertainty = normNum(data.uncertainty, 0);

  const volume = area * floors * height;

  // внешняя площадь стен: ориентировочное отношение "поверхность / площадь"
  const shapeFactor = 2.6; // для многоквартирного/рядового здания
  const wallArea = shapeFactor * area;

  // стена из конструкций/текста
  const wallResolved = resolveWallFromData({
    constructionKey: data.constructionKey,
    wallMaterial: data.wallDescription || data.wallMaterial,
  });

  const Uwall = wallResolved.Uwall;

  // окна
  const windowArea = normNum(
    data.windowArea,
    area * 0.2 // по умолчанию 20% остекление
  );

  const winType = getWindowTypeForData({
    windowType: data.windowTypeKey,
  });

  const Uw = winType.Uw;
  const psi = winType.psi || 0.05;
  const Lf = 4 * Math.sqrt(Math.max(windowArea, 0.01)); // периметр условного окна

  // климат
  const climate = getClimateDesignData(
    data.city,
    data.winterType,
    uncertainty
  );

  const Tdesign = climate.Tdesign;
  const T_inside = tempInside;
  const dT = T_inside - Tdesign;

  // воздух
  const rho = 1.2; // кг/м³
  const cp = 1005; // Дж/(кг·К)

  const ach_inf = normNum(
    data.infiltration,
    guessInfiltration(data.tightness)
  );
  const mdot_inf = (rho * volume * ach_inf) / 3600;

  const ach_vent = 0.35; // простой нормативный расход
  const mdot_vent = (rho * volume * ach_vent) / 3600;

  // потери
  const Qwalls = Uwall * wallArea * dT;
  const Qtrans_win = Uw * windowArea * dT + psi * Lf * dT;
  const Qinf = mdot_inf * cp * dT;
  const Qvent = mdot_vent * cp * dT;

  // солнечные поступления (очень грубо)
  const I_design = 150; // Вт/м²
  const etaSolar = 0.6;
  const Qsolar =
    windowArea * winType.gValue * I_design * etaSolar;

  // внутренние теплопритоки
  const q_int = internalGainSpecific(data); // Вт/м²
  const Qinternal = q_int * area;

  // итоговая расчётная нагрузка
  const Qdesign =
    Qwalls + Qtrans_win + Qinf + Qvent - Qsolar - Qinternal;

  // диапазон с учётом неопределённости по температуре
  let Qmin = Qdesign;
  let Qmax = Qdesign;
  if (dT !== 0 && uncertainty > 0) {
    const dTmin = dT - uncertainty;
    const dTmax = dT + uncertainty;
    const k = Qdesign / dT;
    Qmin = k * dTmin;
    Qmax = k * dTmax;
  }

  // Годовое потребление по HDD-методу
  const k_tot = dT === 0 ? 0 : Qdesign / dT; // Вт/К
  const Eyear_kWh = (k_tot * climate.HDD * 24) / 1000;

  // Кривая Q(T)
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
      Q: Qloc,
      Qmin: QminLoc,
      Qmax: QmaxLoc,
    });
  }

  // Условный суточный профиль
  const dailyData = [];
  for (let h = 0; h < 24; h++) {
    const factor =
      0.85 +
      0.3 * Math.sin(((h - 6) / 24) * 2 * Math.PI) -
      0.2 * Math.sin(((h - 14) / 24) * 2 * Math.PI);
    dailyData.push({
      hour: h,
      Q: Qdesign * factor,
    });
  }

  const designRes = {
    parts: {
      Qwalls,
      Qtrans_win,
      Qinf,
      Qvent,
      Qsolar,
      Qinternal,
    },
  };

  return {
    climate,
    Tdesign,
    T_inside,
    uncert: uncertainty,
    Qdesign,
    Qmin,
    Qmax,
    Eyear_kWh,
    designRes,
    curveData,
    dailyData,
    wallResolved,
    winType,
    wallArea,
    windowArea,
    volume,
  };
}

// ----- Почасовая модель для 8760 ч -----

export function computeHourlyLoad(data) {
  const model = computeEnergyModel(data);
  const climateHours = getHourlyClimate(data.city);

  const k_tot =
    model.T_inside === model.Tdesign
      ? 0
      : model.Qdesign / (model.T_inside - model.Tdesign);

  return climateHours.map((pt) => {
    const dT = model.T_inside - pt.T;
    const Q = Math.max(0, k_tot * dT);
    return Q;
  });
}

// ----- Монте-Карло -----

function randFactor(sigma) {
  // гауссовский множитель ~ N(1, sigma)
  const u = Math.random() || 1e-6;
  const v = Math.random() || 1e-6;
  const z =
    Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return 1 + sigma * z;
}

export function monteCarloSim(data, count = 500) {
  const res = [];

  for (let i = 0; i < count; i++) {
    const d = { ...data };

    d.height = normNum(data.height, 2.7) * randFactor(0.05);
    d.area = normNum(data.area, 100) * randFactor(0.03);
    d.infiltration =
      normNum(data.infiltration, 0.5) * randFactor(0.3);
    d.tempInside =
      normNum(data.tempInside, 22) * randFactor(0.03);
    d.uncertainty =
      normNum(data.uncertainty, 3) * randFactor(0.3);

    const m = computeEnergyModel(d);
    res.push({
      T: m.Tdesign,
      Q: m.Qdesign,
    });
  }

  return res;
}
