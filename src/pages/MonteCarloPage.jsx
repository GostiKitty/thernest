// src/pages/MonteCarloPage.jsx

import { monteCarloSim } from "../core/energyModel";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function MonteCarloPage({ data, onBack }) {
  const sim = monteCarloSim(data, 800); // 800 сценариев

  const avg =
    sim.reduce((s, p) => s + p.Q, 0) / (sim.length || 1);
  const min = Math.min(...sim.map((p) => p.Q));
  const max = Math.max(...sim.map((p) => p.Q));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
      <button
        onClick={onBack}
        className="px-4 py-2 mb-6 rounded-xl border border-slate-300 text-sm bg-white shadow-sm"
      >
        ← Назад
      </button>

      <h1 className="text-2xl sm:text-3xl font-semibold mb-3">
        Анализ неопределённости (Монте-Карло)
      </h1>
      <p className="text-sm sm:text-base text-slate-600 mb-6 max-w-2xl">
        Для здания случайным образом варьируются климат,
        инфильтрация, поведение жильцов и геометрия. Каждая точка —
        отдельный сценарий с собственной расчётной нагрузкой.
      </p>

      <div className="grid gap-4 sm:gap-6 sm:grid-cols-3 mb-6">
        <StatCard
          label="Средняя нагрузка"
          value={avg}
          unit="Вт"
        />
        <StatCard
          label="Минимум по сценариям"
          value={min}
          unit="Вт"
        />
        <StatCard
          label="Максимум по сценариям"
          value={max}
          unit="Вт"
        />
      </div>

      <div className="w-full h-96 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <h2 className="text-sm sm:text-base font-semibold text-slate-900 mb-3">
          Облако сценариев Q(T)
        </h2>
        <div className="w-full h-[320px] sm:h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey="T"
                name="Температура наружного воздуха"
                unit="°C"
              />
              <YAxis
                dataKey="Q"
                name="Тепловая нагрузка"
                unit="Вт"
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                formatter={(val, name) =>
                  name === "Q"
                    ? `${Math.round(val).toLocaleString(
                        "ru-RU"
                      )} Вт`
                    : val
                }
              />
              <Scatter data={sim} fill="#7c3aed" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 sm:p-4">
      <div className="text-[11px] sm:text-xs text-slate-500 mb-1.5">
        {label}
      </div>
      <div className="text-lg sm:text-xl font-semibold text-slate-900">
        {Math.round(value).toLocaleString("ru-RU")} {unit}
      </div>
    </div>
  );
}
