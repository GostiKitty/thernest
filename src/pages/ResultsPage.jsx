// src/pages/ResultsPage.jsx
import { computeCondensationRisk } from "../core/riskCondensation";
import ThermalMap2DPro from "../components/ThermalMap2DPro";

import GradientLegend from "../components/GradientLegend";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  Legend,
  BarChart,
  Bar,
} from "recharts";

import { computeEnergyModel } from "../core/energyModel";
import { computeEconomy } from "../core/economy";
import ThermalMap2D from "../components/ThermalMap2D";

const TABS = [
  { id: "summary", label: "Итоги" },
  { id: "losses", label: "Теплопотери" },
  { id: "thermal", label: "Тепловое поле" },
  { id: "uncertainty", label: "Неопределённость" },
  { id: "economy", label: "Экономика" },
];

export default function ResultsPage({
  data,
  onBack,
  onMonteCarlo,
  onOptimize,
}) {
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

  const heatingType = data.heatingType || "electric";
  const eco = computeEconomy(Eyear_kWh, { heatingType });

  const riskClimate = clamp01(Math.abs(uncert) / 6);
  const riskInfiltration = clamp01(
    (data.infiltration ? Number(data.infiltration) : 0.5) / 1.0
  );
  const riskBehavior = clamp01(
    ((data.windowsOpening || "") + (data.occupancy || "")).length /
      40
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Результаты расчёта
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl">
            Цифровой двойник оценил тепловую нагрузку, годовое
            потребление энергии, экономику эксплуатации и влияние
            неопределённости.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl border border-slate-300 text-sm bg-white shadow-sm"
          >
            ← Назад к вводу
          </button>
          <button
            onClick={onMonteCarlo}
            className="px-4 py-2 rounded-xl border border-indigo-500 text-sm text-indigo-600 bg-indigo-50"
          >
            Анализ неопределённости
          </button>
          <button
            onClick={onOptimize}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-sm text-white shadow"
          >
            Подбор улучшений
          </button>
        </div>
      </div>

      {/* Табы */}
      <div className="flex flex-wrap gap-1.5 mb-6 rounded-2xl bg-slate-50 p-1.5 border border-slate-200">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition
                ${
                  active
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Контент вкладок */}
      {tab === "summary" && (
        <SummaryTab
          model={model}
          eco={eco}
          heatingType={heatingType}
        />
      )}
      {tab === "losses" && (
        <LossesTab designRes={designRes} Qdesign={Qdesign} />
      )}
      {tab === "thermal" && (
        <ThermalTab
          wallArea={wallArea}
          windowArea={windowArea}
          Qdesign={Qdesign}
          T_inside={T_inside}
          Tdesign={Tdesign}
          wallResolved={wallResolved}
          winType={winType}
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
          Eyear_kWh={Eyear_kWh}
          climate={climate}
          eco={eco}
          heatingType={heatingType}
        />
      )}
    </div>
  );
}

/* ---------- TAB: SUMMARY ---------- */

function SummaryTab({ model, eco, heatingType }) {
  const {
    climate,
    Tdesign,
    T_inside,
    Qdesign,
    Qmin,
    Qmax,
    Eyear_kWh,
    volume,
  } = model;

  return (
    <section className="space-y-5 sm:space-y-6">
      <div className="grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)] gap-5 sm:gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <h2 className="text-sm sm:text-base font-semibold text-slate-900 mb-3">
            Основные показатели здания
          </h2>

          <dl className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
            <div>
              <dt className="text-slate-500">Расчётная температура</dt>
              <dd className="font-medium text-slate-900">
                T<sub>н</sub> = {Tdesign.toFixed(1)} °C
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">
                Внутренняя температура
              </dt>
              <dd className="font-medium text-slate-900">
                T<sub>в</sub> = {T_inside.toFixed(1)} °C
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">
                Расчётная тепловая нагрузка
              </dt>
              <dd className="font-medium text-slate-900">
                {Math.round(Qdesign).toLocaleString("ru-RU")} Вт
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Объём здания</dt>
              <dd className="font-medium text-slate-900">
                {Math.round(volume).toLocaleString("ru-RU")} м³
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">
                Годовое потребление тепла
              </dt>
              <dd className="font-medium text-slate-900">
                {Math.round(Eyear_kWh).toLocaleString("ru-RU")} кВт·ч
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">
                Продолжительность отопительного периода
              </dt>
              <dd className="font-medium text-slate-900">
                {climate.hoursHeating.toLocaleString("ru-RU")} ч
              </dd>
            </div>
          </dl>

          {Qmin !== Qmax && (
            <p className="mt-3 text-xs sm:text-sm text-slate-600">
              С учётом неопределённости по климату и эксплуатации
              диапазон возможной нагрузки:{" "}
              <span className="font-semibold text-slate-900">
                {Math.round(Qmin).toLocaleString("ru-RU")} –{" "}
                {Math.round(Qmax).toLocaleString("ru-RU")} Вт.
              </span>
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 mb-2">
              Стоимость отопления
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mb-3">
              Тип системы:{" "}
              <span className="font-medium text-slate-900">
                {eco.meta.label}
              </span>
            </p>

            <p className="text-lg sm:text-xl font-semibold text-slate-900">
              {Math.round(eco.annualCost).toLocaleString("ru-RU")} ₽/год
            </p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              ≈{" "}
              {Math.round(eco.monthlyCost).toLocaleString("ru-RU")}{" "}
              ₽/месяц
            </p>
          </div>

          <p className="mt-3 text-[11px] sm:text-xs text-slate-500">
            Расчёт связан с физической моделью здания и учитывает
            эффективность выбранной системы отопления.
          </p>
        </div>
      </div>

      {/* кратко: графики */}
      <div className="grid lg:grid-cols-2 gap-5 sm:gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Кривая нагрузки Q(T)
          </h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={model.curveData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                />
                <XAxis dataKey="T" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                {model.uncert > 0 && (
                  <>
                    <Area
                      dataKey="Qmax"
                      stroke={false}
                      fill="#bfdbfe"
                      fillOpacity={0.9}
                      name="Верхняя граница"
                    />
                    <Area
                      dataKey="Qmin"
                      stroke={false}
                      fill="#eff6ff"
                      fillOpacity={1}
                      name="Нижняя граница"
                    />
                  </>
                )}
                <Line
                  type="monotone"
                  dataKey="Q"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={false}
                  name="Нагрузка, Вт"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Суточный профиль нагрузки (условный зимний день)
          </h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={model.dailyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="Q"
                  stroke="#0f766e"
                  strokeWidth={3}
                  dot={false}
                  name="Нагрузка, Вт"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- TAB: LOSSES ---------- */

function LossesTab({ designRes, Qdesign }) {
  const parts = designRes.parts;
  const rows = [
    { label: "Стены", value: parts.Qwalls },
    { label: "Окна", value: parts.Qtrans_win },
    { label: "Инфильтрация", value: parts.Qinf },
    { label: "Вентиляция", value: parts.Qvent },
    { label: "Солнечные теплопритоки", value: -parts.Qsolar },
    { label: "Внутренние теплопритоки", value: -parts.Qinternal },
  ];

  const chartData = rows.map((r) => ({
    name: r.label,
    value: r.value,
  }));

  return (
    <section className="space-y-5 sm:space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <h2 className="text-sm sm:text-base font-semibold text-slate-900 mb-3">
          Разбивка теплопотерь
        </h2>

        <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.3fr)] gap-4 sm:gap-6">
          <div>
            <table className="w-full text-xs sm:text-sm">
              <tbody>
                {rows.map((r) => (
                  <LossRow
                    key={r.label}
                    label={r.label}
                    value={r.value}
                  />
                ))}

                <tr className="border-t border-slate-200">
                  <td className="py-1.5 pr-2 font-semibold">
                    Итого нагрузка
                  </td>
                  <td className="py-1.5 text-right font-semibold">
                    {Math.round(Qdesign).toLocaleString("ru-RU")} Вт
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- TAB: THERMAL FIELD ---------- */

/* ---------- TAB: THERMAL FIELD (NEW PROFESSIONAL VERSION) ---------- */

function ThermalTab({
  wallArea,
  windowArea,
  Qdesign,
  T_inside,
  Tdesign,
  wallResolved,
  winType,
}) {
  const Uwall = wallResolved?.Uwall ?? 1.0;
  const Uw = winType?.Uw ?? 1.2;

  // Температура внутренней поверхности
  const Tsi_wall =
    T_inside - Uwall * (T_inside - Tdesign) * 0.13; // Rsi = 0.13
  const Tsi_win =
    T_inside - Uw * (T_inside - Tdesign) * 0.13;

  const risk = computeCondensationRisk({
    T_inside,
    T_out: Tdesign,
    Uwall,
    RH_inside: 50,
  });

  return (
    <section className="space-y-6">
      {/* Карточка с тепловой картой */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-base font-semibold text-slate-900 mb-2">
          Температурное поле ограждающих конструкций
        </h2>

        <p className="text-sm text-slate-600 mb-4">
          Визуализация показывает распределение температур на внутренней поверхности 
          стены и окон при расчётной температуре наружного воздуха.
        </p>

        <ThermalMap2DPro
          Tinside={T_inside}
          Tout={Tdesign}
          Uwall={Uwall}
          Uw={Uw}
          windowShare={windowArea / (wallArea + windowArea)}
        />

        {/* Легенда */}
        <div className="mt-4">
          <GradientLegend
            min={Tsi_wall - 5}
            max={T_inside}
            label="Температура поверхности, °C"
          />
        </div>
      </div>

      {/* Характеристики */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
        <h3 className="font-semibold mb-2">Характеристики ограждений</h3>

        <div className="grid sm:grid-cols-2 gap-4 text-sm text-slate-700">
          <div>
            <p className="font-medium">Стена</p>
            <p>U = {Uwall.toFixed(3)} Вт/м²·К</p>
            <p>Температура поверхности: {Tsi_wall.toFixed(1)} °C</p>
          </div>

          <div>
            <p className="font-medium">Окно</p>
            <p>U = {Uw.toFixed(2)} Вт/м²·К</p>
            <p>Температура поверхности: {Tsi_win.toFixed(1)} °C</p>
          </div>
        </div>

        {/* РИСК КОНДЕНСАТА */}
        <div className="mt-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <p className="font-semibold text-slate-900 mb-1">
            Риск конденсации
          </p>

          <p className="text-sm text-slate-700">
            Точка росы: {risk.dewPoint.toFixed(1)} °C  
            <br />
            Температура поверхности стены: {risk.surfaceTemp.toFixed(1)} °C  
            <br />
          </p>

          <div className="mt-3">
            <RiskBar
              label="Уровень риска"
              value={risk.riskIndex}
            />
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Если температура поверхности ниже точки росы — возможно образование 
            конденсата и плесени.
          </p>
        </div>
      </div>
    </section>
  );
}


/* ---------- TAB: UNCERTAINTY ---------- */

function UncertaintyTab({
  curveData,
  uncert,
  riskClimate,
  riskInfiltration,
  riskBehavior,
}) {
  return (
    <section className="space-y-5 sm:space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <h2 className="text-sm sm:text-base font-semibold text-slate-900 mb-3">
          Диапазон возможных теплопотерь
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mb-3">
          Реальная погода и поведение жильцов отличаются от
          нормативных. Ширина голубой зоны показывает, насколько
          “разъезжаются” теплопотери при разумном разбросе параметров.
        </p>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curveData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
              />
              <XAxis dataKey="T" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {uncert > 0 && (
                <>
                  <Area
                    dataKey="Qmax"
                    stroke={false}
                    fill="#bfdbfe"
                    fillOpacity={0.9}
                    name="Верхняя граница"
                  />
                  <Area
                    dataKey="Qmin"
                    stroke={false}
                    fill="#eff6ff"
                    fillOpacity={1}
                    name="Нижняя граница"
                  />
                </>
              )}
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
          <RiskBar
            label="Климатическая неопределённость"
            value={riskClimate}
          />
          <RiskBar
            label="Инфильтрация / герметичность"
            value={riskInfiltration}
          />
          <RiskBar
            label="Поведение жильцов (окна, график)"
            value={riskBehavior}
          />
        </div>
        <p className="mt-3 text-[11px] sm:text-xs text-slate-500">
          Для детального анализа распределения теплопотерь по
          сценариям используется отдельная страница Монте-Карло.
        </p>
      </div>
    </section>
  );
}

/* ---------- TAB: ECONOMY ---------- */

function EconomyTab({ Eyear_kWh, climate, eco, heatingType }) {
  const scenarios = [
    {
      key: "electric",
      label: "Электроотопление",
      cost: eco.byTariff.electric_single,
    },
    {
      key: "hpump",
      label: "Тепловой насос (COP≈3)",
      cost: eco.byTariff.electric_single / 3,
    },
    {
      key: "gas",
      label: "Газовый котёл",
      cost: eco.byTariff.gas,
    },
    {
      key: "district",
      label: "Центральное отопление",
      cost: eco.byTariff.district,
    },
  ];

  const chartData = scenarios.map((s) => ({
    name: s.label,
    cost: s.cost,
  }));

  return (
    <section className="space-y-5 sm:space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <h2 className="text-sm sm:text-base font-semibold text-slate-900 mb-3">
          Годовая экономика эксплуатации
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 mb-3">
          Для текущего здания годовое теплопотребление составляет{" "}
          <span className="font-semibold text-slate-900">
            {Math.round(Eyear_kWh).toLocaleString("ru-RU")} кВт·ч
          </span>{" "}
          при продолжительности отопительного периода{" "}
          <span className="font-semibold text-slate-900">
            {climate.hoursHeating.toLocaleString("ru-RU")} ч.
          </span>
        </p>

        <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)] gap-4 sm:gap-6">
          <div>
            <p className="text-lg sm:text-xl font-semibold text-slate-900">
              {Math.round(eco.annualCost).toLocaleString("ru-RU")} ₽/год
            </p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Текущий выбранный вариант:{" "}
              <span className="font-medium">
                {eco.meta.label}
              </span>{" "}
              (≈{" "}
              {Math.round(eco.monthlyCost).toLocaleString("ru-RU")}{" "}
              ₽/мес).
            </p>

            <p className="mt-3 text-[11px] sm:text-xs text-slate-500">
              Разные системы отопления дают разную стоимость владения
              при одинаковой тепловой нагрузке здания.
            </p>

            {heatingType === "gas" && eco.carrier.gas_m3 > 0 && (
              <p className="mt-3 text-[11px] sm:text-xs text-slate-500">
                Оценочный расход газа:{" "}
                {eco.carrier.gas_m3.toFixed(1)} м³/год при КПД котла{" "}
                {Math.round(
                  eco.assumptions.boilerEfficiency * 100
                )}
                % и теплоте сгорания{" "}
                {eco.assumptions.gasHeatValue} кВт·ч/м³.
              </p>
            )}
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val) =>
                    `${Math.round(val).toLocaleString("ru-RU")} ₽/год`
                  }
                />
                <Bar dataKey="cost" fill="#0f766e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5 text-xs sm:text-sm text-slate-600">
        В дальнейшем сюда можно добавить детальную экономику:
        сравнение сценариев “до/после” утепления, замену окон,
        установку рекуперации и расчёт срока окупаемости по годам.
      </div>
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
  const percent = Math.round(clamp01(value) * 100);
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
