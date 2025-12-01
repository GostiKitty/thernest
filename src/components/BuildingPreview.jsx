// src/components/BuildingPreview.jsx
import React from "react";

function toNumber(val, def) {
  const n =
    typeof val === "string"
      ? parseFloat(val.replace(",", "."))
      : Number(val);
  return Number.isFinite(n) ? n : def;
}

export default function BuildingPreview({ data, step }) {
  const floors = Math.min(Math.max(toNumber(data.floors, 9), 1), 30);
  const area = toNumber(data.area, 450);
  const height = toNumber(data.height, 2.7);
  const volume = area * height * floors;

  const windowArea = toNumber(
    data.windowArea || area * 0.2,
    area * 0.2
  );
  const glazingRatio = Math.round((windowArea / (area || 1)) * 100);

  const city = data.city || "Москва";
  const tempInside = data.tempInside || "22";
  const winter = data.winterType || "нормальная";

  return (
    <section className="tn-card relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="tn-tag">Шаг {step} / 8</p>
          <h2 className="text-sm font-semibold text-slate-800">
            Цифровой профиль здания
          </h2>
        </div>
        <span className="tn-badge tn-badge-blue">TherNest Twin</span>
      </div>

      {/* 3D-блок */}
      <div className="mt-2 mb-4 flex justify-center">
        <div className="tn-building-root">
          <div className="tn-building-base" />
          <div className="tn-building-shadow" />
          <div className="tn-building-tower">
            {Array.from({ length: Math.min(floors, 16) }).map((_, i) => (
              <div key={i} className="tn-building-floor">
                <div className="tn-building-window tn-window-left" />
                <div className="tn-building-window tn-window-center" />
                <div className="tn-building-window tn-window-right" />
              </div>
            ))}
          </div>
          <div className="tn-building-glow" />
          <div className="tn-building-grid" />
        </div>
      </div>

      {/* Цифровой паспорт */}
      <div className="space-y-2 text-xs sm:text-sm">
        <Row label="Город" value={city} />
        <Row label="Зимний режим" value={winter} />
        <Row
          label="Этажность"
          value={`${floors} эт. · h = ${height.toFixed(2)} м`}
        />
        <Row
          label="Площадь / объём"
          value={`${Math.round(area).toLocaleString("ru-RU")} м² · ${Math.round(
            volume
          ).toLocaleString("ru-RU")} м³`}
        />
        <Row
          label="Остекление"
          value={`≈ ${glazingRatio}% фасада`}
        />
        <Row label="Tвнутр." value={`${tempInside} °C`} />
      </div>
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800 text-right">
        {value}
      </span>
    </div>
  );
}
