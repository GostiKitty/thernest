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

  const avg = sim.reduce((s, p) => s + p.Q, 0) / sim.length;
  const min = Math.min(...sim.map((p) => p.Q));
  const max = Math.max(...sim.map((p) => p.Q));

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <button
        onClick={onBack}
        className="px-4 py-2 mb-6 rounded-xl border border-slate-300"
      >
        ← Назад
      </button>

      <h1 className="text-2xl font-semibold mb-4">
        Анализ неопределённости (Монте-Карло)
      </h1>

      <p className="text-lg mb-4">
        Средняя нагрузка:{" "}
        <span className="font-bold text-blue-600">
          {Math.round(avg).toLocaleString("ru-RU")} Вт
        </span>
      </p>

      <p className="text-lg mb-8">
        Диапазон:{" "}
        <span className="font-bold text-red-600">
          {Math.round(min).toLocaleString("ru-RU")} –{" "}
          {Math.round(max).toLocaleString("ru-RU")} Вт
        </span>
      </p>

      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="T" name="Температура" unit="°C" />
            <YAxis dataKey="Q" name="Нагрузка" unit="Вт" />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={sim} fill="#7c3aed" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
