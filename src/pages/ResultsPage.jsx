// src/pages/ResultsPage.jsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  Legend,
} from "recharts";

import { computeEnergyModel } from "../core/energyModel";
import { computeEconomy } from "../core/economy";

export default function ResultsPage({ data, onBack, onMonteCarlo, onOptimize }) {
  const model = computeEnergyModel(data);

  const {
    climate,
    Tdesign,
    T_inside,
    uncert,
    Qdesign,
    Qmin,
    Qmax,
    Eyear_kWh,
    designRes,
    curveData,
    dailyData,
    wallResolved,
    winType,
  } = model;

  // Экономика годового потребления
  const eco = computeEconomy(Eyear_kWh);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* BACK */}
      <button
        onClick={onBack}
        className="px-4 py-2 mb-6 rounded-xl border border-slate-300 hover:bg-slate-100 shadow-sm"
      >
        ← Назад
      </button>

      <h1 className="text-3xl font-semibold mb-6 tracking-tight">
        Результаты теплотехнического расчёта
      </h1>

      {/* BUTTONS */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={onMonteCarlo}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl shadow hover:bg-purple-700"
        >
          Монте-Карло (неопределённость)
        </button>

        <button
          onClick={onOptimize}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl shadow hover:bg-emerald-700"
        >
          Подбор улучшений →
        </button>
      </div>

      {/* MAIN METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

        {/* HEATING LOAD */}
        <div className="p-6 rounded-2xl bg-white shadow-lg border">
          <h2 className="text-xl font-semibold mb-2">
            Расчётная тепловая нагрузка
          </h2>

          <p className="text-4xl font-bold text-blue-600">
            {Math.round(Qdesign).toLocaleString("ru-RU")} Вт
          </p>

          <p className="text-slate-600 mt-2">
            при Tн = {Tdesign}°C, Tв = {T_inside}°C
          </p>

          {uncert > 0 && (
            <p className="mt-3 text-slate-700">
              Диапазон (учёт неопределённости):{" "}
              <span className="font-semibold">
                {Math.round(Qmin).toLocaleString("ru-RU")} –{" "}
                {Math.round(Qmax).toLocaleString("ru-RU")} Вт
              </span>
            </p>
          )}

          <div className="mt-4 text-xs text-slate-500">
            Стена: {wallResolved.description} <br />
            U ≈ {wallResolved.Uwall.toFixed(2)} Вт/м²·К
          </div>

          <div className="text-xs text-slate-500 mt-1">
            Окна: {winType.name}, Uw ≈ {winType.Uw.toFixed(2)} Вт/м²·К
          </div>
        </div>

        {/* ENERGY – ANNUAL */}
        <div className="p-6 rounded-2xl bg-white shadow-lg border">
          <h2 className="text-xl font-semibold mb-2">
            Годовое энергопотребление
          </h2>

          <p className="text-3xl font-bold text-emerald-600">
            {Math.round(Eyear_kWh).toLocaleString("ru-RU")} кВт·ч/год
          </p>

          <p className="text-slate-600 mt-2">
            отопительный период: {climate.hoursHeating.toLocaleString("ru-RU")} ч
          </p>

          <hr className="my-4" />

          <p className="text-md font-semibold text-slate-700">
            Стоимость отопления: {Math.round(eco.annualCost).toLocaleString("ru-RU")} ₽/год
          </p>

          <p className="text-slate-600 text-sm mt-1">
            ≈ {Math.round(eco.monthlyCost).toLocaleString("ru-RU")} ₽/месяц
          </p>
        </div>

      </div>

      {/* PARTS TABLE */}
      <div className="p-6 rounded-2xl bg-white shadow border mb-10">
        <h3 className="text-lg font-semibold mb-4">
          Разбивка теплопотерь
        </h3>

        <table className="w-full text-sm">
          <tbody>
            <Row label="Стены" value={designRes.parts.Qwalls} />
            <Row label="Окна" value={designRes.parts.Qtrans_win} />
            <Row label="Инфильтрация" value={designRes.parts.Qinf} />
            <Row label="Вентиляция" value={designRes.parts.Qvent} />

            <Row label="Солнечные" value={-designRes.parts.Qsolar} />
            <Row label="Внутренние" value={-designRes.parts.Qinternal} />

            <tr className="border-t font-semibold">
              <td className="py-2">Итого:</td>
              <td className="py-2 text-right">
                {Math.round(Qdesign).toLocaleString("ru-RU")} Вт
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Q(T) GRAPH */}
      <div className="p-6 rounded-2xl bg-white shadow border mb-10">
        <h3 className="text-lg font-semibold mb-4">
          Зависимость нагрузки Q(T)
        </h3>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curveData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="T" />
              <YAxis />
              <Tooltip />
              <Legend />

              <Area
                dataKey="Qmax"
                stroke={false}
                fill="#dbeafe"
                fillOpacity={0.7}
              />

              <Area
                dataKey="Qmin"
                stroke={false}
                fill="#eff6ff"
                fillOpacity={1}
              />

              <Line
                type="monotone"
                dataKey="Q"
                stroke="#2563eb"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DAILY PROFILE */}
      <div className="p-6 rounded-2xl bg-white shadow border">
        <h3 className="text-lg font-semibold mb-4">
          Суточный профиль нагрузки
        </h3>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />

              <Line
                type="monotone"
                dataKey="Q"
                stroke="#0f766e"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

function Row({ label, value }) {
  return (
    <tr>
      <td className="py-2 text-slate-600">{label}</td>
      <td className="py-2 text-right">
        {Math.round(value).toLocaleString("ru-RU")} Вт
      </td>
    </tr>
  );
}
