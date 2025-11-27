// src/pages/ConstructorPage.jsx
import { useState } from "react";
import ResultsPage from "./ResultsPage";
import EnergySimPage from "./EnergySimPage";
import MonteCarloPage from "./MonteCarloPage";
import OptimizationPage from "./OptimizationPage";

import InputSuggest from "../components/InputSuggest";

import { ARCHETYPES } from "../data/archetypes";
import {
  WINDOW_TYPES,
  applyArchetypeDefaults,
  SUGGEST_MATERIALS,
  SUGGEST_WINDOWS
} from "../data/buildingDB";

export default function ConstructorPage() {
  const [step, setStep] = useState(1);

  const [data, setData] = useState({
    archetypeKey: "",
    floors: "",
    area: "",
    height: "",
    wallDescription: "",
    wallMaterial: "",

    windowArea: "",
    windowTypeKey: "",

    infiltration: "",
    tightness: "",

    city: "",
    winterType: "",
    uncertainty: "",
    wind: "",

    tempInside: "",
    windowsOpening: "",
    occupancy: "",
    appliances: "",
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-semibold mb-6 tracking-tight">
        Конструктор цифрового двойника
      </h1>

      <Stepper step={step} />

      <div className="mt-10">
        {step === 1 && (
          <Step1_Building
            data={data}
            setData={setData}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <Step2_Windows
            data={data}
            setData={setData}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <Step3_Climate
            data={data}
            setData={setData}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && (
          <Step4_Usage
            data={data}
            setData={setData}
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
            onSimulate={() => setStep(6)}
          />
        )}

        {step === 5 && (
          <ResultsPage
            data={data}
            onBack={() => setStep(4)}
            onMonteCarlo={() => setStep(7)}
            onOptimize={() => setStep(8)}
          />
        )}

        {step === 6 && (
          <EnergySimPage data={data} onBack={() => setStep(4)} />
        )}

        {step === 7 && (
          <MonteCarloPage data={data} onBack={() => setStep(5)} />
        )}

        {step === 8 && (
          <OptimizationPage data={data} onBack={() => setStep(5)} />
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   STEPPER
------------------------------------------------------- */

function Stepper({ step }) {
  const steps = [
    { label: "Здание", num: 1 },
    { label: "Окна", num: 2 },
    { label: "Климат", num: 3 },
    { label: "Эксплуатация", num: 4 },
    { label: "Результат", num: 5 },
    { label: "8760 ч", num: 6 },
    { label: "Монте-Карло", num: 7 },
    { label: "Улучшения", num: 8 },
  ];

  return (
    <div className="grid grid-cols-7 gap-3">
      {steps.map(({ label, num }) => {
        const active = step === num;
        const done = num < step;

        return (
          <div
            key={num}
            className={`
              flex flex-col items-center p-3 rounded-xl shadow transition-all border
              ${active ? "bg-blue-600 text-white border-blue-600 scale-[1.03]" : ""}
              ${done ? "bg-green-500 text-white border-green-500" : ""}
              ${!active && !done ? "bg-white border-slate-300 text-slate-700" : ""}
            `}
          >
            <div className="text-lg font-bold">{num}</div>
            <div className="text-[10px] mt-1">{label}</div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------
   STEP 1 — Здание
------------------------------------------------------- */

function Step1_Building({ data, setData, onNext }) {
  const handleArchetypeChange = (key) => {
    // FIXED: правильный порядок аргументов
    setData((prev) => applyArchetypeDefaults(key, prev));
  };

  return (
    <div className="flex flex-col gap-6 pt-4">
      {/* Типовое здание */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="text-sm text-slate-500 mb-2 font-medium">
          Типовое здание (по желанию)
        </div>

        <select
          value={data.archetypeKey || ""}
          onChange={(e) => handleArchetypeChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">— Не выбрано —</option>
          {ARCHETYPES.map((a) => (
            <option key={a.key} value={a.key}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* Геометрия */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <InputCard
          title="Этажность"
          value={data.floors}
          onChange={(v) => setData((prev) => ({ ...prev, floors: v }))}
          placeholder="Например: 9"
        />

        <InputCard
          title="Площадь дома, м²"
          value={data.area}
          onChange={(v) => setData((prev) => ({ ...prev, area: v }))}
          placeholder="2500"
        />

        <InputCard
          title="Высота потолков, м"
          value={data.height}
          onChange={(v) => setData((prev) => ({ ...prev, height: v }))}
          placeholder="2.7"
        />

        <InputSuggest
          title="Конструкция стен"
          value={data.wallDescription}
          onChange={(v) => setData((prev) => ({ ...prev, wallDescription: v }))}
          placeholder="кирпич 380мм + минвата 100мм"
          suggestions={SUGGEST_MATERIALS}
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="px-6 py-3 rounded-xl bg-blue-600 text-white shadow"
        >
          Далее →
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   STEP 2 — Окна
------------------------------------------------------- */

function Step2_Windows({ data, setData, onNext, onBack }) {

  const normalizeWindowType = (text) => {
    const t = text.toLowerCase();
    if (t.includes("3") || t.includes("тр") || t.includes("low")) return "std_3ch";
    if (t.includes("дерев")) return "old_wood";
    return "std_2ch";
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">

      <InputSuggest
        title="Тип окон"
        value={data.windowTypeKey}
        onChange={(v) =>
          setData((prev) => ({
            ...prev,
            windowTypeKey: normalizeWindowType(v),
          }))
        }
        placeholder="двухкамерный / трёхкамерный / ПВХ"
        suggestions={SUGGEST_WINDOWS}
      />

      <InputCard
        title="Площадь окон, м²"
        value={data.windowArea}
        onChange={(v) => setData((prev) => ({ ...prev, windowArea: v }))}
      />

      <InputCard
        title="Инфильтрация, ACH"
        value={data.infiltration}
        onChange={(v) => setData((prev) => ({ ...prev, infiltration: v }))}
      />

      <InputCard
        title="Герметичность"
        value={data.tightness}
        onChange={(v) => setData((prev) => ({ ...prev, tightness: v }))}
      />

      <div className="col-span-2 flex justify-between mt-2">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl border border-slate-300 shadow-sm"
        >
          ← Назад
        </button>

        <button
          onClick={onNext}
          className="px-6 py-3 rounded-xl bg-blue-600 text-white shadow"
        >
          Далее →
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   STEP 3 — Климат
------------------------------------------------------- */

function Step3_Climate({ data, setData, onNext, onBack }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">

      <InputCard
        title="Город"
        value={data.city}
        onChange={(v) => setData((prev) => ({ ...prev, city: v }))}
      />

      <InputCard
        title="Тип зимы"
        value={data.winterType}
        onChange={(v) => setData((prev) => ({ ...prev, winterType: v }))}
      />

      <InputCard
        title="Неопределённость, ±°C"
        value={data.uncertainty}
        onChange={(v) => setData((prev) => ({ ...prev, uncertainty: v }))}
      />

      <InputCard
        title="Скорость ветра, м/с"
        value={data.wind}
        onChange={(v) => setData((prev) => ({ ...prev, wind: v }))}
      />

      <div className="col-span-2 flex justify-between mt-2">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl border border-slate-300 shadow-sm"
        >
          ← Назад
        </button>

        <button
          onClick={onNext}
          className="px-6 py-3 rounded-xl bg-blue-600 text-white shadow"
        >
          Далее →
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   STEP 4 — Эксплуатация
------------------------------------------------------- */

function Step4_Usage({ data, setData, onBack, onNext, onSimulate }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">

      <InputCard
        title="Температура внутри, °C"
        value={data.tempInside}
        onChange={(v) => setData((prev) => ({ ...prev, tempInside: v }))}
      />

      <InputCard
        title="Открывание окон"
        value={data.windowsOpening}
        onChange={(v) => setData((prev) => ({ ...prev, windowsOpening: v }))}
      />

      <InputCard
        title="График жильцов"
        value={data.occupancy}
        onChange={(v) => setData((prev) => ({ ...prev, occupancy: v }))}
      />

      <InputCard
        title="Бытовые приборы"
        value={data.appliances}
        onChange={(v) => setData((prev) => ({ ...prev, appliances: v }))}
      />

      <div className="col-span-2 flex justify-between mt-4">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl border border-slate-300 shadow-sm"
        >
          ← Назад
        </button>

        <button
          onClick={onSimulate}
          className="px-6 py-3 rounded-xl bg-indigo-600 text-white shadow"
        >
          Почасовая симуляция (8760 ч)
        </button>

        <button
          onClick={onNext}
          className="px-6 py-3 rounded-xl bg-blue-600 text-white shadow"
        >
          Рассчитать →
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   INPUT UI
------------------------------------------------------- */

function InputCard({ title, value, onChange, placeholder }) {
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
      <div className="text-sm text-slate-500 mb-2 font-medium">{title}</div>

      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
      />
    </div>
  );
}

function SelectCard({ title, value, onChange, options, placeholder, className = "" }) {
  return (
    <div className={`p-5 rounded-2xl bg-white border border-slate-200 shadow-sm ${className}`}>
      <div className="text-sm text-slate-500 mb-2 font-medium">{title}</div>

      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
      >
        <option value="">{placeholder || "Не выбрано"}</option>

        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
