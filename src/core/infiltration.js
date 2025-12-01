// src/core/infiltration.js
// Модель инфильтрации и вентиляции

const AIR_DENSITY = 1.2; // кг/м³
const AIR_CP = 1005; // Дж/(кг·К)

/**
 * Оценка кратности воздухообмена ACH по тексту про герметичность.
 * Используется, если пользователь не задал инфильтрацию числом.
 */
export function guessInfiltrationACH(tightnessTxt) {
  const t = (tightnessTxt || "").toLowerCase();

  if (t.includes("низ")) return 0.8; // низкая герметичность
  if (t.includes("выс")) return 0.3; // высокая герметичность
  if (t.includes("гермет")) return 0.25; // очень герметичное здание
  if (t.includes("стар")) return 1.0; // старый фонд

  return 0.5; // среднее значение
}

/**
 * Уточнённая оценка ACH с учётом:
 * - ручного значения (если есть)
 * - текста про герметичность
 * - скорости ветра
 * - этажности
 */
export function computeInfiltrationACH({
  userACH,
  tightness,
  windSpeed,
  floors,
}) {
  let ach = 0;

  if (userACH != null && userACH !== "") {
    const val = parseFloat(
      String(userACH).replace(",", ".")
    );
    if (Number.isFinite(val) && val > 0) {
      ach = val;
    }
  }

  if (!ach) {
    ach = guessInfiltrationACH(tightness);
  }

  const v = Number.isFinite(windSpeed) ? windSpeed : 3; // м/с
  const windFactor = 0.3 * (v - 3); // грубое усиление от ветра
  const floorFactor = (floors && floors > 1) ? 0.05 * (floors - 1) : 0;

  ach *= 1 + windFactor + floorFactor;

  if (ach < 0.1) ach = 0.1;
  if (ach > 2.0) ach = 2.0;

  return ach;
}

/**
 * Кратность воздухообмена для вентиляции.
 * Пока простая модель: базовое значение + надбавка за "офисный" режим.
 */
export function computeVentilationACH({ occupancy }) {
  const occ = (occupancy || "").toLowerCase();
  let ach = 0.35; // базовый СНиП/ASHRAE-порядок

  if (occ.includes("офис") || occ.includes("много людей")) {
    ach = 0.7;
  }

  return ach;
}

/**
 * Массовый расход воздуха при заданном ACH.
 */
export function massFlowFromACH({ volume, ach }) {
  const V = volume || 0;
  const achVal = ach || 0;
  return (AIR_DENSITY * V * achVal) / 3600; // кг/с
}

/**
 * Потери тепла на инфильтрацию.
 */
export function infiltrationHeatLoss({
  volume,
  dT,
  userACH,
  tightness,
  windSpeed,
  floors,
}) {
  const ach = computeInfiltrationACH({
    userACH,
    tightness,
    windSpeed,
    floors,
  });

  const mdot = massFlowFromACH({ volume, ach });
  return mdot * AIR_CP * dT; // Вт
}

/**
 * Потери тепла на вентиляцию.
 */
export function ventilationHeatLoss({ volume, dT, occupancy }) {
  const achVent = computeVentilationACH({ occupancy });
  const mdotVent = massFlowFromACH({ volume, ach: achVent });
  return mdotVent * AIR_CP * dT;
}
