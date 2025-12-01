// src/pages/ResultsPage.jsx
import { useState } from "react";
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
import ThermalField from "../components/ThermalField";

export default function ResultsPage({ data, onBack, onMonteCarlo, onOptimize }) {
  const [tab, setTab] = useState("summary");

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
    wallArea,
    windowArea,
    volume,
  } = model;

  const eco = computeEconomy(Eyear_kWh, {
    heatingType: data.heatingType || "electric",
  });

  const area =
    Number((data.area || "").toString().replace(",", ".")) || 0;
  const specific_kWh_m2 = area > 0 ? Eyear_kWh / area : null;
  const cost_m2 =
    area > 0 ? eco.annualCost / area : null;

  const inf =
    parseFloat((data.infiltration || "0.5").toString().replace(",", ".")) ||
    0.5;
  const riskInfiltration = clamp01((inf - 0.3) / 0.6);
  const riskClimate = clamp01((uncert || 0) / 6);
  const riskBehavior = (() => {
    const occ = (data.occupancy || "").toLowerCase();
    const app = (data.appliances || "").toLowerCase();
    let r = 0.3;
    if (occ.includes("всегда") || occ.includes("ноч")) r += 0.3;
    if (app.includes("выс")) r += 0.3;
    return clamp01(r);
  })();

  const tabs = [
    { id: "summary", label: "Сводка" },
    { id: "losses", label: "Теплопотери" },
    { id: "thermal", label: "Температурное поле" },
    { id: "uncertainty", label: "Неопределённость" },
    { id: "economy", label: "Экономика" },
  ];

  const floors =
    Number((data.floors || "").toString().replace(",", ".")) || 1;
  const mode =
    (data.winterType || "").toLowerCase().includes("лет")
      ? "summer"
      : "winter";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <button
        onClick={onBack}
        className="px-4 py-2 mb-4 rounded-xl border border-slate-300 hover:bg-slate-50 shadow-sm text-sm"
      >
        ← Назад к конструктору
      </button>

      <h1 className="text-2xl sm:text-3xl font-semibold mb-3 tracking-tight">
        Результаты теплотехнического расчёта
      </h1>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-1">
            Цифровой двойник
          </p>
          <h2 className="text-sm sm:text-base font-semibold text-slate-900 mb-2">
            Модель оценила теплопотери здания, годовое энергопотребление,
            температурное поле фасада и экономику выбранной системы отопления.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Внизу можно переключать вкладки: сводка по расчёту, структура
            теплопотерь, условное температурное поле, влияние неопределённости
            и экономическая оценка.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onMonteCarlo}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl shadow hover:bg-purple-700 text-sm"
          >
            Анализ неопределённости
          </button>
          <button
            onClick={onOptimize}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl shadow hover:bg-emerald-700 text-sm"
          >
            Предложить улучшения →
          </button>
        </div>
      </div>

      {/* табы */}
      <div className="mb-5 flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm border transition
                ${
                  active
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* содержимое вкладок */}
      <div className="space-y-6 sm:space-y-8">
        {tab === "summary" && (
          <SummaryTab
            Qdesign={Qdesign}
            Tdesign={Tdesign}
            T_inside={T_inside}
            uncert={uncert}
            Qmin={Qmin}
            Qmax={Qmax}
            Eyear_kWh={Eyear_kWh}
            eco={eco}
            wallResolved={wallResolved}
            winType={winType}
            climate={climate}
            specific_kWh_m2={specific_kWh_m2}
            cost_m2={cost_m2}
            volume={volume}
            wallArea={wallArea}
            windowArea={windowArea}
            heatingType={data.heatingType || "electric"}
          />
        )}

        {tab === "losses" && (
          <LossesTab
            designRes={designRes}
            Qdesign={Qdesign}
            curveData={curveData}
            dailyData={dailyData}
          />
        )}

        {tab === "thermal" && (
          <ThermalTab
            model={model}
            data={data}
            floors={floors}
            mode={mode}
          />
        )}

        {tab === "uncertainty" && (
          <UncertaintyTab
            curveData={curveData}
            uncert={uncert}
            riskClimate={riskClimate}
            riskInfiltration={riskInfiltration}
            riskBehavior={riskBehavior}
          />
        )}

        {tab === "economy" && (
          <EconomyTab
            eco={eco}
            Eyear_kWh={Eyear_kWh}
            area={area}
            cost_m2={cost_m2}
            heatingType={data.heatingType || "electric"}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- ВКЛАДКИ ---------- */

function SummaryTab({
  Qdesign,
  Tdesign,
  T_inside,
  uncert,
  Qmin,
  Qmax,
  Eyear_kWh,
  eco,
  wallResolved,
  winType,
  climate,
  specific_kWh_m2,
  cost_m2,
  volume,
  wallArea,
  windowArea,
  heatingType,
}) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-1">
          Основной расчёт
        </p>
        <h2 className="text-sm font-semibold text-slate-900 mb-2">
          Сколько тепла уходит из здания
        </h2>

        <p className="text-3xl sm:text-4xl font-bold text-blue-600 leading-tight">
          {Math.round(Qdesign).toLocaleString("ru-RU")} Вт
        </p>
        <p className="mt-1 text-sm text-slate-600">
          при расчётной температуре наружного воздуха{" "}
          <span className="font-medium">{Tdesign} °C</span> и
          желаемой температуре внутри{" "}
          <span className="font-medium">{T_inside} °C</span>.
        </p>

        {uncert > 0 && (
          <p className="mt-2 text-xs sm:text-sm text-slate-700">
            Диапазон с учётом неопределённости:{" "}
            <span className="font-semibold">
              {Math.round(Qmin).toLocaleString("ru-RU")} –{" "}
              {Math.round(Qmax).toLocaleString("ru-RU")} Вт
            </span>
            .
          </p>
        )}

        <div className="mt-4 text-[11px] sm:text-xs text-slate-500 space-y-1">
          <p>
            Стена:{" "}
            <span className="font-medium">
              {wallResolved.description || "—"}
            </span>{" "}
            · U ≈{" "}
            {wallResolved.Uwall
              ? wallResolved.Uwall.toFixed(2)
              : "—"}{" "}
            Вт/(м²·К)
          </p>
          <p>
            Окна:{" "}
            <span className="font-medium">
              {winType.label || winType.key || "—"}
            </span>{" "}
            · Uw ≈{" "}
            {winType.Uw ? winType.Uw.toFixed(2) : "—"} Вт/(м²·К)
          </p>
          <p>
            Климат:{" "}
            <span className="font-medium">
              {climate.name} ({climate.region})
            </span>
            .
          </p>
          <p>
            Объём здания ≈{" "}
            <span className="font-medium">
              {Math.round(volume).toLocaleString("ru-RU")} м³
            </span>
            .
          </p>
          <p>
            Площадь ограждений: стены{" "}
            <span className="font-medium">
              {Math.round(wallArea).toLocaleString("ru-RU")} м²
            </span>
            , окна{" "}
            <span className="font-medium">
              {Math.round(windowArea).toLocaleString("ru-RU")} м²
            </span>
            .
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-1">
          Энергопотребление
        </p>
        <h2 className="text-sm font-semibold text-slate-900 mb-2">
          Годовое потребление на отопление
        </h2>

        <p className="text-3xl sm:text-4xl font-bold text-emerald-600 leading-tight">
          {Math.round(Eyear_kWh).toLocaleString("ru-RU")} кВт·ч/год
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {specific_kWh_m2 && (
            <>
              Удельное потребление:{" "}
              <span className="font-medium">
                {specific_kWh_m2.toFixed(1)} кВт·ч/м²·год
              </span>
              .
            </>
          )}
        </p>

        <div className="mt-4 text-[11px] sm:text-xs text-slate-500 space-y-1">
          <p>
            Часы отопительного периода:{" "}
            <span className="font-medium">
              {Math.round(climate.hoursHeating).toLocaleString("ru-RU")} ч
            </span>
            .
          </p>
          <p>
            Расчёт учитывает теплопотери по ограждениям, инфильтрацию,
            вентиляцию, внутренние и солнечные теплопритоки.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-1">
          Система отопления
        </p>
        <h2 className="text-sm font-semibold text-slate-900 mb-2">
          {eco.meta.label}
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          {eco.meta.description}
        </p>

        <div className="mt-4 text-[11px] sm:text-xs text-slate-500 space-y-1">
          <p>
            Годовые затраты:{" "}
            <span className="font-semibold">
              {Math.round(eco.annualCost).toLocaleString("ru-RU")} ₽/год
            </span>{" "}
            (≈{" "}
            {Math.round(eco.monthlyCost).toLocaleString("ru-RU")} ₽/мес
            {cost_m2 && ` · ${cost_m2.toFixed(0)} ₽/м²·год`}
            ).
          </p>
          {heatingType === "gas" && (
            <p>
              Расход газа: {eco.carrier.gas_m3.toFixed(1)} м³/год.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function LossesTab({ designRes, Qdesign, curveData, dailyData }) {
  return (
    <>
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <h2 className="text-sm sm:text-base font-semibold text-slate-900 mb-3">
          Разбивка теплопотерь по составляющим
        </h2>
        <table className="w-full text-xs sm:text-sm">
          <tbody>
            <LossRow label="Через стены" value={designRes.parts.Qwalls} />
            <LossRow label="Через окна" value={designRes.parts.Qtrans_win} />
            <LossRow
              label="Инфильтрация"
              value={designRes.parts.Qinf}
            />
            <LossRow
              label="Вентиляция"
              value={designRes.parts.Qvent}
            />
            <LossRow
              label="Солнечные притоки"
              value={-designRes.parts.Qsolar}
            />
            <LossRow
              label="Внутренние притоки"
              value={-designRes.parts.Qinternal}
            />
            <tr className="border-t border-slate-200 font-semibold">
              <td className="py-2">Итого</td>
              <td className="py-2 text-right">
                {Math.round(Qdesign).toLocaleString("ru-RU")} Вт
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Как меняются теплопотери при разной температуре
          </h3>
          <div className="w-full min-h-[220px] h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curveData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="T" unit="°C" />
                <YAxis />
                <Tooltip />
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

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Профиль нагрузки по отопительному периоду
          </h3>
          <div className="w-full min-h-[220px] h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChartLike data={dailyData} />
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </>
  );
}

function AreaChartLike({ data }) {
  return (
    <Area
      type="monotone"
      dataKey="Q"
      stroke="#0f766e"
      fill="#a7f3d0"
      strokeWidth={2}
      dot={false}
      name="Нагрузка, Вт"
      data={data}
    />
  );
}

function ThermalTab({ model, data, floors, mode }) {
  const windowsPerFloor = 3;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4 lg:gap-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <h2 className="text-sm sm:text-base font-semibold text-slate-900 mb-3">
          Условное температурное поле фасада
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mb-3">
          Цвет показывает оценочную температуру внутренней поверхности
          стен и окон при расчётной температуре наружного воздуха.
          Углы здания холоднее из-за тепловых мостиков, окна —
          наиболее уязвимые зоны.
        </p>

        <ThermalField
          floors={floors}
          windowsPerFloor={windowsPerFloor}
          Tinside={model.T_inside}
          Tout={model.Tdesign}
          Uwall={model.designRes.Uwall}
          Uw={model.designRes.Uw}
          mode={mode}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">
          Интерпретация
        </h3>
        <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 space-y-1.5">
          <li>красные зоны — самые тёплые участки внутренней поверхности;</li>
          <li>синие/фиолетовые — потенциальные зоны риска конденсации;</li>
          <li>углы и стыки стен/окон специально “переохлаждены” как тепловые мостики;</li>
          <li>режим «{mode === "summer" ? "лето" : "зима"}» можно менять во входных данных.</li>
        </ul>
      </div>
    </section>
  );
}

function UncertaintyTab({
  curveData,
  uncert,
  riskClimate,
  riskInfiltration,
  riskBehavior,
}) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <h2 className="text-sm sm:text-base font-semibold text-slate-900 mb-3">
          Диапазон нагрузок при изменении исходных данных
        </h2>
        <div className="w-full min-h-[220px] h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curveData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="T" unit="°C" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="Q"
                stroke="#2563eb"
                strokeWidth={3}
                dot={false}
                name="Номинальный расчёт"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">
          Индексы неопределённости
        </h3>
        <div className="space-y-3">
          <RiskBar label="Инфильтрация / герметичность" value={riskInfiltration} />
          <RiskBar label="Климатическая неопределённость" value={riskClimate} />
          <RiskBar label="Поведение жильцов и приборы" value={riskBehavior} />
        </div>
      </div>
    </section>
  );
}

function EconomyTab({ eco, Eyear_kWh, area, cost_m2, heatingType }) {
  return (
    <section className="space-y-5 sm:space-y-6">
    {/* оставляю как у тебя было, можно не трогать, чтобы не раздувать ответ */}
    {/* ... твой существующий EconomyTab отсюда ... */}
    </section>
  );
}

/* ---------- ВСПОМОГАТЕЛЬНОЕ ---------- */

function LossRow({ label, value }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-1.5 pr-2 text-slate-600">{label}</td>
      <td className="py-1.5 text-right font-medium text-slate-900">
        {Math.round(value).toLocaleString("ru-RU")} Вт
      </td>
    </tr>
  );
}

function RiskBar({ label, value }) {
  const percent = Math.round(value * 100);
  let color = "bg-emerald-500";
  if (percent >= 33 && percent < 66) color = "bg-amber-500";
  if (percent >= 66) color = "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] sm:text-xs text-slate-500">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function clamp01(x) {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}
