// src/pages/EnergySimPage.jsx
import { getHourlyClimate } from "../core/climate";
import { computeHourlyLoad } from "../core/energyModel";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function EnergySimPage({ data, onBack }) {
  const hourly = computeHourlyLoad(data);
  const climate = getHourlyClimate(data.city);

  const merged = hourly.map((Q, i) => ({
    hour: i,
    T: climate[i].T,
    Q,
  }));

  const Eyear_kWh =
    hourly.reduce((sum, q) => sum + q / 1000, 0) || 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
      <button
        onClick={onBack}
        className="px-4 py-2 mb-6 rounded-xl border border-slate-300 text-sm bg-white shadow-sm"
      >
        ← Назад
      </button>

      <h1 className="text-2xl sm:text-3xl font-semibold mb-4">
        Почасовая симуляция (8760 ч)
      </h1>

      <p className="text-sm sm:text-base text-slate-600 mb-4">
        Для каждого часа года учитываются наружная температура и
        климатический файл, а цифровой двойник пересчитывает
        тепловую нагрузку здания.
      </p>

      <div className="text-lg sm:text-xl mb-6">
        Годовое потребление:{" "}
        <span className="font-bold text-blue-600">
          {Math.round(Eyear_kWh).toLocaleString("ru-RU")} кВт·ч
        </span>
      </div>

      <div className="w-full h-96 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <h2 className="text-sm sm:text-base font-semibold text-slate-900 mb-3">
          Почасовой профиль нагрузки
        </h2>
        <div className="w-full h-[320px] sm:h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={merged}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
              />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="Q"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                name="Тепловая нагрузка, Вт"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
