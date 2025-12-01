import { useEffect, useRef } from "react";

export default function ThermalMap2DPro({
  Tinside = 22,
  Tout = -15,
  Uwall = 0.3,
  Uw = 1.2,
  windowShare = 0.25,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    const ctx = c.getContext("2d");
    const W = 400;
    const H = 220;
    c.width = W;
    c.height = H;

    const cols = 80;
    const rows = 40;

    const cellW = W / cols;
    const cellH = H / rows;

    // Безопасные значения
    const Tsi_wall =
      Tinside - (Uwall || 0.3) * (Tinside - Tout) * 0.13;
    const Tsi_window =
      Tinside - (Uw || 1.2) * (Tinside - Tout) * 0.13;

    const safeWall = isFinite(Tsi_wall) ? Tsi_wall : Tinside - 4;
    const safeWindow = isFinite(Tsi_window) ? Tsi_window : Tinside - 6;

    const windowCells = Math.floor(cols * rows * (windowShare || 0.25));

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function tempToColor(T) {
      const Tmin = Math.min(safeWall - 5, safeWindow - 5);
      const Tmax = Tinside;

      const x = (T - Tmin) / (Tmax - Tmin);
      const clamped = Math.max(0, Math.min(1, x));

      const r = lerp(59, 239, clamped);
      const g = lerp(130, 68, clamped);
      const b = lerp(246, 68, clamped);

      return `rgb(${r},${g},${b})`;
    }

    for (let i = 0; i < cols * rows; i++) {
      const isWindow = i < windowCells;
      const baseT = isWindow ? safeWindow : safeWall;

      const x = i % cols;
      const y = Math.floor(i / cols);

      const Ty = baseT + (y / rows) * 0.4;

      ctx.fillStyle = tempToColor(Ty);
      ctx.fillRect(x * cellW, y * cellH, cellW + 1, cellH + 1);
    }
  }, [Tinside, Tout, Uwall, Uw, windowShare]);

  return (
    <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden w-full flex justify-center">
      <canvas ref={canvasRef} className="max-w-full h-auto" />
    </div>
  );
}
