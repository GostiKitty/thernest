// src/data/materialsDB.js

export const MATERIALS = [
  {
    key: "brick_solid",
    names: ["кирпич", "кирпич полнотелый", "brick solid"],
    group: "masonry",
    lambda: 0.81,
  },
  {
    key: "brick_hollow",
    names: ["кирпич пустотелый", "hollow brick", "щелевой кирпич"],
    group: "masonry",
    lambda: 0.45,
  },
  {
    key: "aerated_D300",
    names: ["газобетон", "газобетон d300", "aerated 300"],
    group: "aerated",
    lambda: 0.09,
  },
  {
    key: "aerated_D400",
    names: ["газобетон d400", "aerated 400"],
    group: "aerated",
    lambda: 0.11,
  },
  {
    key: "aerated_D500",
    names: ["газобетон d500", "aerated 500"],
    group: "aerated",
    lambda: 0.13,
  },
  {
    key: "concrete_heavy",
    names: ["бетон", "жб", "жби", "панель", "concrete"],
    group: "concrete",
    lambda: 1.75,
  },
  {
    key: "mineral_wool",
    names: ["вата", "минвата", "rockwool", "mineral wool"],
    group: "insulation",
    lambda: 0.04,
  },
  {
    key: "eps",
    names: ["ппс", "пенопласт", "eps"],
    group: "insulation",
    lambda: 0.035,
  },
  {
    key: "xps",
    names: ["xps", "экструдированный", "пенополистирол"],
    group: "insulation",
    lambda: 0.032,
  },
  {
    key: "gypsum",
    names: ["гкл", "гипс", "гипсокартон", "gypsum"],
    group: "gypsum",
    lambda: 0.21,
  },
  {
    key: "plaster",
    names: ["штукатурка", "plaster"],
    group: "plaster",
    lambda: 0.7,
  },
  {
    key: "wood",
    names: ["дерево", "брус", "osb", "wood"],
    group: "wood",
    lambda: 0.15,
  },
];
