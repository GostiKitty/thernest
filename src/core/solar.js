// src/core/solar.js
// Упрощённые солнечные теплопритоки через остекление

/**
 * Ориентация фасада влияет на притоки:
 *  - юг: максимум
 *  - восток/запад: средне
 *  - север: минимум
 */
export function orientationFactor(orientation) {
  const o = (orientation || "").toLowerCase();

  if (!o) return 0.7; // "смешанная" ориентация

  if (o.includes("юг")) return 1.0;
  if (o.includes("юго-вост") || o.includes("юго вост")) return 0.9;
  if (o.includes("юго-зап") || o.includes("юго зап")) return 0.9;

  if (o.includes("вост") || o.includes("запад")) return 0.7;

  if (o.includes("север")) return 0.3;

  return 0.7;
}

/**
 * Базовая расчётная солнечная радиация на вертикальную поверхность.
 * Можно в будущем завязать на климатический файл/город.
 */
export function designSolarIrradiance({ climateKey, season = "winter" }) {
  // Очень грубые значения:
  // зима: 80–150 Вт/м²
  // межсезонье: 200–300 Вт/м²
  // лето: 400–600 Вт/м²
  switch (season) {
    case "summer":
      return 450;
    case "mid":
      return 250;
    default:
      return 150;
  }
}

/**
 * Солнечные притоки через остекление при расчётном состоянии.
 *
 * Qsolar = Aw * g * I * η
 */
export function computeSolarGains({
  windowArea,
  gValue,
  orientation,
  shadingFactor,
  climateKey,
  season,
}) {
  const Aw = windowArea || 0;
  const g = gValue || 0.5;

  const I = designSolarIrradiance({ climateKey, season });

  const f_orient = orientationFactor(orientation);
  const f_shade =
    shadingFactor != null ? shadingFactor : 0.6; // доля от открытого солнца

  const effectiveI = I * f_orient * f_shade;

  return Aw * g * effectiveI; // Вт
}
