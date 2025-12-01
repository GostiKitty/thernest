// src/core/layers.js
// Утилиты для работы со слоями ограждающих конструкций

import { MATERIALS } from "../data/materialsDB";
import { WALL_CONSTRUCTIONS } from "../data/wallConstructions";

// ---------------------------------------------
// Вспомогательные функции
// ---------------------------------------------

function parseNumber(raw, def = NaN) {
  if (raw == null) return def;
  if (typeof raw === "number") return raw;

  const s = String(raw).replace(",", ".").trim();
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : def;
}

/**
 * Приводим толщину к метрам.
 * - Если значение >= 10 → считаем, что это миллиметры.
 * - Если < 10 → считаем, что это уже метры.
 */
export function normalizeThickness(raw, defMeters = 0.1) {
  const n = parseNumber(raw, NaN);
  if (!Number.isFinite(n) || n <= 0) return defMeters;

  if (n >= 10) {
    // мм → м
    return n / 1000;
  }
  return n; // уже в метрах
}

/**
 * Поиск материала по key
 */
export function getMaterialByKey(key) {
  return MATERIALS.find((m) => m.key === key) || null;
}

/**
 * Очень мягкий поиск материала по тексту ("кирпич 380мм", "газобетон", "минвата").
 */
export function guessMaterialKeyFromText(text) {
  if (!text) return "brick_solid";
  const t = text.toLowerCase();

  // Приоритет — точное совпадение из словаря
  for (const m of MATERIALS) {
    if (m.names?.some((name) => t.includes(name.toLowerCase()))) {
      return m.key;
    }
  }

  // Простейшие эвристики
  if (t.includes("газобет")) return "aerated_concrete";
  if (t.includes("пенопласт") || t.includes("пенополист")) return "eps";
  if (t.includes("минват") || t.includes("mineral")) return "mineral_wool";
  if (t.includes("бетон")) return "concrete_heavy";
  if (t.includes("дерев") || t.includes("брус")) return "wood";
  if (t.includes("гкл") || t.includes("гипс")) return "gypsum";
  if (t.includes("штукат")) return "plaster";

  // Фоллбек — "кирпич"
  return "brick_solid";
}

/**
 * Слой из текстового фрагмента.
 * Примеры:
 *   "кирпич 380мм"
 *   "газобетон 300"
 *   "минвата 100 мм"
 */
export function parseLayerToken(token) {
  if (!token) return null;
  const raw = token.toLowerCase().trim();

  // Ищем число
  const match = raw.match(/([\d.,]+)\s*(мм|mm|см|cm|м|m)?/i);
  const numStr = match?.[1];
  const unit = match?.[2]?.toLowerCase() || "";

  let thicknessMeters = 0.1;
  if (numStr) {
    const n = parseNumber(numStr, NaN);
    if (Number.isFinite(n)) {
      if (unit.includes("мм") || unit === "mm") thicknessMeters = n / 1000;
      else if (unit.includes("см") || unit === "cm") thicknessMeters = n / 100;
      else if (unit === "м" || unit === "m") thicknessMeters = n;
      else {
        // без явной единицы: если значение большое — вероятно, мм
        thicknessMeters = n >= 10 ? n / 1000 : n;
      }
    }
  }

  const materialText = raw.replace(numStr || "", "");
  const materialKey = guessMaterialKeyFromText(materialText);

  return {
    materialKey,
    thickness: thicknessMeters,
    raw: token.trim(),
  };
}

/**
 * Разбор текстового описания стены.
 * Пример:
 *  "кирпич 380мм + минвата 100мм + штукатурка 20мм"
 */
export function parseWallDescription(description) {
  if (!description) return [];

  const parts = description
    .split(/[\+\;\,]/)
    .map((p) => p.trim())
    .filter(Boolean);

  const layers = [];
  for (const part of parts) {
    const layer = parseLayerToken(part);
    if (layer) layers.push(layer);
  }

  return layers;
}

/**
 * Берём слои из типовой конструкции по ключу.
 */
export function layersFromConstructionKey(constructionKey) {
  if (!constructionKey) return null;
  const c = WALL_CONSTRUCTIONS.find((w) => w.key === constructionKey);
  if (!c) return null;

  return c.layers.map((lay) => ({
    materialKey: lay.material,
    thickness: normalizeThickness(lay.thickness),
    raw: `${lay.material} ${lay.thickness}м`,
  }));
}

/**
 * Универсальный "резолвер" слоёв по данным от пользователя:
 *  - если задана типовая конструкция → используем её
 *  - иначе → парсим текстовое описание
 */
export function resolveLayersFromInput({ constructionKey, wallDescription }) {
  let layers = layersFromConstructionKey(constructionKey);
  let source = "construction";

  if (!layers || layers.length === 0) {
    layers = parseWallDescription(wallDescription || "");
    source = "text";
  }

  // Если всё равно пусто — задаём хотя бы один слой по умолчанию
  if (!layers || layers.length === 0) {
    layers = [
      {
        materialKey: "brick_solid",
        thickness: 0.38,
        raw: "кирпич 380мм (по умолчанию)",
      },
    ];
    source = "default";
  }

  return { layers, source };
}
