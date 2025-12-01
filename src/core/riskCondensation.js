// src/core/riskCondensation.js
// Оценка риска конденсации и плесени на внутренней поверхности стены

import { Rsi } from "./uvalue";

/**
 * Давление насыщенного пара по упрощённой формуле Магнуса.
 * T — в °C.
 */
export function saturationVaporPressure(T) {
  // Формула Магнуса для воды в диапазоне -45…60 °C (гПа → Па)
  const a = 6.112;
  const b = 17.62;
  const c = 243.12;

  const es_hPa = a * Math.exp((b * T) / (T + c));
  return es_hPa * 100; // Па
}

/**
 * Точка росы по температуре воздуха и относительной влажности RH (%) .
 */
export function dewPoint(T, RH) {
  const rh = Math.max(1, Math.min(RH, 100)) / 100;
  const a = 17.27;
  const b = 237.7;

  const alpha = (a * T) / (b + T) + Math.log(rh);
  const Td = (b * alpha) / (a - alpha);
  return Td;
}

/**
 * Оценка температуры внутренней поверхности ограждения.
 * Используем 1D-модель:
 *   Tsi = Ti - (Q * Rsi),
 * где Q = U * (Ti - To)
 */
export function innerSurfaceTemperature({ T_inside, T_out, Uwall }) {
  const Ti = T_inside;
  const To = T_out;
  const U = Uwall || 1;

  const dT = Ti - To;
  const Q = U * dT; // Вт/м²

  const dTsi = Q * Rsi; // падение температуры на внутреннем плёнке
  return Ti - dTsi;
}

/**
 * Оценка риска конденсации на внутренней поверхности.
 * Возвращает:
 *  - dewPoint: точка росы воздуха
 *  - Tsi: температура поверхности
 *  - riskIndex: 0…1
 *  - level: "low" | "medium" | "high"
 */
export function computeCondensationRisk({
  T_inside,
  T_out,
  RH_inside = 50,
  Uwall,
}) {
  const Td = dewPoint(T_inside, RH_inside);
  const Tsi = innerSurfaceTemperature({ T_inside, T_out, Uwall });

  // Если Tsi сильно выше Td — риска почти нет.
  let risk = 0;
  const diff = Tsi - Td;

  if (diff <= 0) {
    risk = 1; // поверхность холоднее или равна точке росы
  } else if (diff < 3) {
    risk = 0.7;
  } else if (diff < 5) {
    risk = 0.4;
  } else {
    risk = 0.1;
  }

  let level = "low";
  if (risk >= 0.7) level = "high";
  else if (risk >= 0.4) level = "medium";

  return {
    dewPoint: Td,
    surfaceTemp: Tsi,
    riskIndex: risk,
    level,
  };
}
