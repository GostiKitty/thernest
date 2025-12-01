// src/components/BuildingPreview.jsx
import React from "react";

export default function BuildingPreview({ data, step }) {
  const floors =
    Number((data.floors || "").toString().replace(",", ".")) || 1;
  const clampedFloors = Math.min(Math.max(floors, 1), 25);

  const area =
    Number((data.area || "").toString().replace(",", ".")) || 0;
  const windowArea =
    Number((data.windowArea || "").toString().replace(",", ".")) || 0;

  const windowShare =
    area > 0 && windowArea > 0
      ? Math.min(windowArea / area, 0.6)
      : 0.25;

  const modeLabel =
    (data.winterType || "").toLowerCase().includes("лет")
      ? "лето"
      : "зима";

  const usageLabel =
    step >= 4
      ? (data.occupancy || data.appliances || "обычная эксплуатация")
      : "типовой режим";

  const cardHighlight =
    step === 1 ? "Геометрия" : step === 2 ? "Окна" : step === 3 ? "Климат" : "Эксплуатация";

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-2">
          Визуализация здания
        </p>

        <BuildingFacade floors={clampedFloors} windowShare={windowShare} />

        <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-slate-600">
          <div>
            <div className="text-slate-400">Этажность</div>
            <div className="font-semibold">{clampedFloors}</div>
          </div>
          <div>
            <div className="text-slate-400">Площадь</div>
            <div className="font-semibold">
              {area > 0 ? `${area.toFixed(0)} м²` : "—"}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Доля остекления</div>
            <div className="font-semibold">
              {(windowShare * 100).toFixed(0)}%
            </div>
          </div>
          <div>
            <div className="text-slate-400">Режим</div>
            <div className="font-semibold capitalize">{modeLabel}</div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3 text-[11px] text-slate-600">
        <div className="font-semibold text-slate-800 mb-1">
          Сейчас заполняем: {cardHighlight}
        </div>
        <p className="mb-1">
          Режим эксплуатации: <span className="font-medium">{usageLabel}</span>
        </p>
        <p>
          Графическая модель не претендует на BIM-точность, а служит
          **ориентиром**: этажность, остекление и режим эксплуатации
          используются в расчёте теплопотерь и годового потребления.
        </p>
      </div>
    </div>
  );
}

function BuildingFacade({ floors, windowShare }) {
  const maxFloorsForDraw = 12;
  const drawFloors = Math.min(floors, maxFloorsForDraw);

  const windowsPerFloor =
    windowShare > 0.4 ? 4 : windowShare > 0.25 ? 3 : 2;

  const cells = Array.from({ length: drawFloors }, (_, i) => i);

  return (
    <div className="flex justify-center">
      <svg
        viewBox="0 0 120 140"
        className="w-full max-w-[220px]"
        aria-hidden="true"
      >
        {/* фон */}
        <rect x="0" y="0" width="120" height="140" fill="#eef2f7" />

        {/* корпус */}
        <rect
          x="22"
          y="10"
          width="76"
          height="120"
          rx="4"
          fill="#dde4f0"
          stroke="#1f2937"
          strokeWidth="0.6"
        />

        {/* этажи */}
        {cells.map((_, idx) => {
          const fh = 120 / drawFloors;
          const y = 10 + idx * fh;
          return (
            <g key={idx}>
              <line
                x1="22"
                x2="98"
                y1={y}
                y2={y}
                stroke="rgba(15,23,42,0.2)"
                strokeWidth="0.4"
              />
            </g>
          );
        })}

        {/* окна */}
        {cells.map((_, fIdx) => {
          const fh = 120 / drawFloors;
          const baseY = 10 + fIdx * fh + fh * 0.2;
          const winH = fh * 0.55;

          const stepX = 76 / (windowsPerFloor + 1);
          const winW = stepX * 0.6;

          return Array.from({ length: windowsPerFloor }, (_, wIdx) => {
            const cx = 22 + stepX * (wIdx + 1);
            const x = cx - winW / 2;

            return (
              <rect
                key={`${fIdx}-${wIdx}`}
                x={x}
                y={baseY}
                width={winW}
                height={winH}
                fill="url(#winGrad)"
                stroke="rgba(15,23,42,0.45)"
                strokeWidth="0.5"
                rx="1.5"
              />
            );
          });
        })}

        {/* градиент для окон */}
        <defs>
          <linearGradient id="winGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c7d7f7" />
            <stop offset="100%" stopColor="#7ba0e9" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
