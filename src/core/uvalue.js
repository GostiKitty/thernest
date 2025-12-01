// src/core/uvalue.js
// Расчёт термического сопротивления и коэффициента теплопередачи

import { MATERIALS } from "../data/materialsDB";
import { WALL_CONSTRUCTIONS } from "../data/wallConstructions";
import { resolveLayersFromInput } from "./layers";

// Типичные поверхностные сопротивления (м²·К/Вт)
export const Rsi = 0.13; // внутренняя поверхности
export const Rse = 0.04; // наружная поверхность

function getMaterialLambda(materialKey) {
  const m = MATERIALS.find((mat) => mat.key === materialKey);
  return m?.lambda ?? 0.8; // если не нашли — считаем как плотный кирпич
}

/**
 * R слоя = толщину (м) / λ
 */
export function computeLayerR(layer) {
  const lambda = getMaterialLambda(layer.materialKey);
  const d = layer.thickness || 0.1;
  return d / lambda;
}

/**
 * Полное сопротивление конструкции из слоёв.
 */
export function computeRTotal(layers, { withSurface = true } = {}) {
  if (!layers || layers.length === 0) return 0;

  let Rsum = 0;
  for (const lay of layers) {
    Rsum += computeLayerR(lay);
  }

  if (withSurface) {
    Rsum += Rsi + Rse;
  }

  return Rsum;
}

/**
 * U = 1 / R_total
 */
export function computeUFromLayers(layers, opts = {}) {
  const Rtot = computeRTotal(layers, opts);
  if (Rtot <= 0) return 5; // экстремально плохая стена
  return 1 / Rtot;
}

/**
 * Описание стены для цифрового двойника по данным пользователя.
 * Возвращает:
 * - layers: нормализованные слои
 * - R: общее термическое сопротивление
 * - Uwall: коэффициент теплопередачи
 * - label / description: удобные текстовые описания
 * - source: "construction" | "text" | "default"
 */
export function describeWallFromInput({ constructionKey, wallDescription }) {
  const { layers, source } = resolveLayersFromInput({
    constructionKey,
    wallDescription,
  });

  const R = computeRTotal(layers, { withSurface: true });
  const Uwall = computeUFromLayers(layers, { withSurface: true });

  let label = "";
  if (constructionKey) {
    const c = WALL_CONSTRUCTIONS.find((w) => w.key === constructionKey);
    label = c?.name || "";
  }

  const description =
    label ||
    wallDescription ||
    layers.map((l) => l.raw || l.materialKey).join(" + ");

  return {
    layers,
    R,
    Uwall,
    label: label || "Пользовательская конструкция",
    description,
    source,
  };
}
