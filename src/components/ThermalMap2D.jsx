// src/components/ThermalMap2D.jsx

export default function ThermalMap2D({
  wallArea,
  windowArea,
  Qdesign,
  T_inside,
  Tdesign,
}) {
  const w = 8; // условная сетка 8×5
  const h = 5;

  const totalArea = wallArea + (windowArea || 0.01);
  const windowShare = totalArea > 0 ? windowArea / totalArea : 0.2;

  // количество "оконных" ячеек
  const windowCells = Math.round(w * h * windowShare);

  const cells = Array.from({ length: w * h }).map((_, i) => {
    const isWindow = i < windowCells;
    return {
      id: i,
      isWindow,
    };
  });

  // грубый градиент "температуры" по высоте и типу ячейки
  const dT = T_inside - Tdesign;
  const normDT = dT <= 0 ? 0 : Math.min(dT / 40, 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-8 gap-1 sm:gap-1.5">
        {cells.map((c) => {
          const row = Math.floor(c.id / w);
          const heightFactor = 1 - row / (h - 1 || 1); // ближе к улице/крыше

          const base = c.isWindow ? 0.7 : 0.3;
          const t =
            base + 0.4 * heightFactor * normDT; // 0–1

          // мягкий градиент от “холодного” к “тёплому”
          const cold = { r: 59, g: 130, b: 246 };
          const hot = { r: 239, g: 68, b: 68 };

          const r = Math.round(cold.r + (hot.r - cold.r) * t);
          const g = Math.round(cold.g + (hot.g - cold.g) * t);
          const b = Math.round(cold.b + (hot.b - cold.b) * t);

          return (
            <div
              key={c.id}
              className="aspect-[1/1] rounded-[6px] border border-slate-200/40 shadow-sm"
              style={{
                backgroundColor: `rgb(${r}, ${g}, ${b})`,
              }}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-[4px] border border-slate-200/60 bg-blue-500/70" />
          Холодные зоны (наружные стены / мостики холода)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-[4px] border border-slate-200/60 bg-red-400/80" />
          Более тёплые зоны
        </span>
      </div>

      <p className="text-[11px] sm:text-xs text-slate-500">
        Это не фот реализованного здания, а быстрая 2D-визуализация
        теплового поля: чем краснее ячейка, тем выше локальные
        теплопотери при расчётной температуре наружного воздуха.
      </p>
    </div>
  );
}
