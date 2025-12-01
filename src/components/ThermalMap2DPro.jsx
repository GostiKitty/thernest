import { useEffect, useRef } from "react";

/**
 * ThermalMap2DPro  — визуализация фасада здания:
 * ✔ тепловые мостики
 * ✔ режим зима/лето
 * ✔ динамические этажи
 * ✔ окна по этажам
 * ✔ распределение температур по физике
 */

export default function ThermalMap2DPro({
  mode = "winter", // "winter" | "summer"
  floors = 9,
  Tinside = 22,
  Tout = -15,
  solarGain = 6,       // летом увеличим
  Uwall = 0.3,
  Uw = 1.2,
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

    // ------------------------------
    // ТЕМПЕРАТУРЫ ПОВЕРХНОСТЕЙ
    // ------------------------------
    const Rsi = 0.13;

    // зимой стены холоднее, окна ещё холоднее
    let T_wall = Tinside - Uwall * (Tinside - Tout) * Rsi;
    let T_window = Tinside - Uw * (Tinside - Tout) * Rsi;

    // летом окна наоборот горячее из-за солнца
    if (mode === "summer") {
      T_wall = Tinside - Uwall * (Tinside - Tout) * Rsi + 2;
      T_window = T_wall + solarGain; // окна перегреваются
    }

    const Tmin = Math.min(Tout - 5, T_wall - 5);
    const Tmax = Math.max(Tinside + 6, T_window + 6);

    // ------------------------------
    // ФУНКЦИИ ПОМОЩНИКИ
    // ------------------------------
    const lerp = (a, b, t) => a + (b - a) * t;

    const tempColor = (T) => {
      const x = Math.min(1, Math.max(0, (T - Tmin) / (Tmax - Tmin)));
      const r = Math.floor(lerp(30, 255, x));
      const g = Math.floor(lerp(80, 120, x));
      const b = Math.floor(lerp(160, 40, x));
      return `rgb(${r},${g},${b})`;
    };

    // ------------------------------
    // ОТРИСОВКА ФОНА
    // ------------------------------
    ctx.fillStyle = "#dce5f1";
    ctx.fillRect(0, 0, W, H);

    // ------------------------------
    // ГЕОМЕТРИЯ ЗДАНИЯ
    // ------------------------------
    const facadeX = 45;
    const facadeY = 20;
    const facadeW = W - 90;
    const facadeH = H - 40;

    // этажи
    const floorHeight = facadeH / floors;

    // ------------------------------
    // ТЕПЛОВЫЕ МОСТИКИ (УГЛЫ)
    // ------------------------------
    function wallTempWithBridges(xRatio, yRatio) {
      // ближе к углу — холоднее
      const cornerFactor =
        Math.pow(1 - Math.min(xRatio, 1 - xRatio), 3) +
        Math.pow(1 - Math.min(yRatio, 1 - yRatio), 3);

      const bridgeLoss = mode === "winter" ? 3 : -2;

      return T_wall - cornerFactor * bridgeLoss;
    }

    // ------------------------------
    // РИСОВАНИЕ СТЕН (ГРАДИЕНТ + МОСТИКИ)
    // ------------------------------
    for (let y = 0; y < facadeH; y++) {
      for (let x = 0; x < facadeW; x++) {
        const xr = x / facadeW;
        const yr = y / facadeH;

        const Tlocal = wallTempWithBridges(xr, yr);
        ctx.fillStyle = tempColor(Tlocal);
        ctx.fillRect(facadeX + x, facadeY + y, 1, 1);
      }
    }

    // ------------------------------
    // ОКНА (на всех этажах)
    // ------------------------------
    const winW = facadeW * 0.22;
    const winH = floorHeight * 0.55;
    const gapX = facadeW * 0.1;

    for (let f = 0; f < floors; f++) {
      const y = facadeY + f * floorHeight + floorHeight * 0.2;

      for (let col = 0; col < 2; col++) {
        const x =
          facadeX +
          gapX * (col + 1) +
          winW * col +
          (col === 0 ? 15 : -15);

        drawWindow(ctx, x, y, winW, winH, T_window, Tmin, Tmax);
      }
    }

    // ------------------------------
    // КОНТУР ЗДАНИЯ
    // ------------------------------
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#1f2b40";
    ctx.strokeRect(facadeX, facadeY, facadeW, facadeH);
  }, [mode, floors, Tinside, Tout, Uwall, Uw]);

  return (
    <div className="w-full flex justify-center">
      <canvas
        ref={canvasRef}
        style={{
          maxWidth: "100%",
          borderRadius: "16px",
          boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
        }}
      />
    </div>
  );
}

// -----------------------------------------------------------------
// ОКНА
// -----------------------------------------------------------------
function drawWindow(ctx, x, y, w, h, Twindow, Tmin, Tmax) {
  const lerp = (a, b, t) => a + (b - a) * t;

  const t = (Twindow - Tmin) / (Tmax - Tmin);
  const cold = Math.max(0, Math.min(1, t));

  const blue = `rgba(${lerp(50, 200, cold)}, ${lerp(
    90,
    180,
    cold
  )}, ${lerp(255, 80, cold)}, 1)`;

  ctx.fillStyle = blue;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = "#102030";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}
