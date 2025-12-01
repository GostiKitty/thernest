// src/components/ThermalField.jsx
import { useRef, useEffect } from "react";

/**
 * ThermalField — строгая 2D визуализация температурного поля фасада.
 * - floors: этажность
 * - windowsPerFloor: кол-во окон на этаже
 * - Tinside, Tout, Uwall, Uw — из модели
 * - mode: "winter" | "summer"
 */
export default function ThermalField({
  floors = 9,
  windowsPerFloor = 3,
  Tinside = 22,
  Tout = -15,
  Uwall = 0.3,
  Uw = 1.2,
  mode = "winter",
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");

    const W = 420;
    const H = 260;
    c.width = W;
    c.height = H;

    const Rsi = 0.13;

    let Tsi_wall = Tinside - Uwall * (Tinside - Tout) * Rsi;
    let Tsi_win = Tinside - Uw * (Tinside - Tout) * Rsi;

    if (mode === "summer") {
      Tsi_wall += 1.5;
      Tsi_win += 4;
    }

    const Tmin = Math.min(Tout - 4, Tsi_wall - 6);
    const Tmax = Math.max(Tinside + 4, Tsi_win + 4);

    const lerp = (a, b, t) => a + (b - a) * t;

    const tempColor = (T) => {
      const x = Math.max(0, Math.min(1, (T - Tmin) / (Tmax - Tmin)));
      const r = lerp(60, 220, x);
      const g = lerp(100, 60, x);
      const b = lerp(150, 40, x);
      return `rgb(${r},${g},${b})`;
    };

    // фон
    ctx.fillStyle = "#eef2f7";
    ctx.fillRect(0, 0, W, H);

    const facadeX = 40;
    const facadeY = 20;
    const facadeW = W - 80;
    const facadeH = H - 40;

    const floorH = facadeH / floors;

    // стены + тепловые мостики
    for (let y = 0; y < facadeH; y++) {
      for (let x = 0; x < facadeW; x++) {
        const xR = x / facadeW;
        const yR = y / facadeH;

        const bridges =
          Math.pow(1 - Math.min(xR, 1 - xR), 2) * 4 +
          Math.pow(1 - Math.min(yR, 1 - yR), 2) * 4;

        const Tlocal = Tsi_wall - bridges;
        ctx.fillStyle = tempColor(Tlocal);
        ctx.fillRect(facadeX + x, facadeY + y, 1, 1);
      }
    }

    // окна по этажам
    const winW = facadeW / (windowsPerFloor * 1.7);
    const winH = floorH * 0.55;
    const gapX = facadeW / (windowsPerFloor + 1);

    for (let f = 0; f < floors; f++) {
      const y = facadeY + f * floorH + floorH * 0.22;

      for (let i = 0; i < windowsPerFloor; i++) {
        const x = facadeX + gapX * (i + 1) - winW / 2;
        drawWindow(ctx, x, y, winW, winH, Tsi_win, Tmin, Tmax);
      }
    }

    // контур фасада
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 2;
    ctx.strokeRect(facadeX, facadeY, facadeW, facadeH);
  }, [floors, windowsPerFloor, Tinside, Tout, Uwall, Uw, mode]);

  return (
    <div className="w-full flex justify-center">
      <canvas
        ref={canvasRef}
        style={{
          maxWidth: "100%",
          borderRadius: "16px",
          boxShadow: "0 6px 16px rgba(15,23,42,0.25)",
        }}
      />
    </div>
  );
}

function drawWindow(ctx, x, y, w, h, T, Tmin, Tmax) {
  const lerp = (a, b, t) => a + (b - a) * t;
  const xVal = Math.max(0, Math.min(1, (T - Tmin) / (Tmax - Tmin)));

  const r = lerp(70, 230, xVal);
  const g = lerp(130, 90, xVal);
  const b = lerp(190, 70, xVal);

  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = "rgba(15,23,42,0.5)";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x, y, w, h);
}
