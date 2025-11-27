// Fake EPW simplified dataset (8760h) — we will replace later with real EPW parser.

export const MoscowEPW = {
  city: "Moscow",
  latitude: 55.75,
  longitude: 37.61,

  // массив на 8760 часов
  hours: Array.from({ length: 8760 }).map((_, i) => {
    const hour = i % 24;
    const day = Math.floor(i / 24);

    // имитация суточного цикла
    const T =
      -5 +
      10 * Math.sin(((hour - 8) / 24) * Math.PI) +
      5 * Math.sin((day / 365) * 2 * Math.PI);

    const solar =
      Math.max(0, Math.sin(((hour - 8) / 24) * Math.PI)) *
      (200 + 100 * Math.sin((day / 365) * 2 * Math.PI));

    return {
      hour,
      day,
      Tout: T,
      G_solar: solar,
    };
  }),
};
