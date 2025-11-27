// src/core/hourlyBalance.js

import { computeEnergyModel } from "./energyModel";

export function computeHourlyBalance(data, epwData) {
  // получаем базовый расчёт и климат
  const base = computeEnergyModel(data);

  const T_inside = base.T_inside;
  const model = base;

  const hours = epwData.hours.map((h) => {
    const Tout = h.Tout;
    const G = h.G_solar;

    // тепловой баланс по формуле из energyModel
    const res = model.designRes; // временно используем структуру

    // SN: использовали формулу из energyModel:
    function Q_total(Tout, Gwin) {
      const dT = T_inside - Tout;

      const Qwalls = model.wallResolved.Uwall * model.wallArea * dT;

      const Uw = model.winType.Uw;
      const psi = model.winType.psi;
      const Lf = model.windowArea > 0 ? 4 * Math.sqrt(model.windowArea) : 0;

      const Qwin = Uw * model.windowArea * dT + psi * Lf * dT;

      const rho = 1.2;
      const cp = 1005;

      const mdot_inf =
        (rho *
          (data.area * data.floors * data.height) *
          (data.ach || 0.5)) /
        3600;

      const mdot_vent =
        (rho *
          (data.area * data.floors * data.height) *
          0.35) /
        3600;

      const Qinf = mdot_inf * cp * dT;
      const Qvent = mdot_vent * cp * dT;

      const etaSolar = 0.6;
      const Qsolar = model.windowArea * model.winType.gValue * G * etaSolar;

      return (
        Qwalls + Qwin + Qinf + Qvent - Qsolar - model.designRes.parts.Qinternal
      );
    }

    const Q = Q_total(Tout, G);

    return {
      time: h,
      Q: Math.round(Q),
      Tout,
      Gsolar: G,
    };
  });

  // месячные суммы (примерно 730 часов в месяц)
  const months = Array.from({ length: 12 }).map((_, m) => {
    const start = m * 730;
    const end = start + 730;
    const slice = hours.slice(start, end);
    const sum = slice.reduce((acc, x) => acc + Math.max(x.Q, 0), 0);
    return {
      month: m + 1,
      E_kWh: Math.round(sum / 1000),
    };
  });

  return {
    hours,
    months,
  };
}
