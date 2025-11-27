// src/data/wallConstructions.js

export const WALL_CONSTRUCTIONS = [
  {
    key: "panel_300",
    name: "Панель 3-слойная (300 мм)",
    layers: [
      { material: "plaster", thickness: 0.02 },
      { material: "concrete_heavy", thickness: 0.22 },
      { material: "mineral_wool", thickness: 0.06 },
    ],
  },
  {
    key: "aerated_300",
    name: "Газобетон 300 мм + штукатурка",
    layers: [
      { material: "aerated_D400", thickness: 0.30 },
      { material: "plaster", thickness: 0.02 },
    ],
  },
  {
    key: "brick_380_mw100",
    name: "Кирпич 380 мм + минвата 100 мм + штукатурка",
    layers: [
      { material: "brick_solid", thickness: 0.38 },
      { material: "mineral_wool", thickness: 0.1 },
      { material: "plaster", thickness: 0.02 },
    ],
  },
  {
    key: "frame_insulated",
    name: "Каркасная стена (OSB + минвата + ГКЛ)",
    layers: [
      { material: "wood", thickness: 0.015 },
      { material: "mineral_wool", thickness: 0.15 },
      { material: "gypsum", thickness: 0.012 },
    ],
  },
];
