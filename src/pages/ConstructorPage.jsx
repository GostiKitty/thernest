// src/pages/ConstructorPage.jsx
import { useState, useEffect } from "react";
import ResultsPage from "./ResultsPage";
import EnergySimPage from "./EnergySimPage";
import MonteCarloPage from "./MonteCarloPage";
import OptimizationPage from "./OptimizationPage";

import InputSuggest from "../components/InputSuggest";
import BuildingPreview from "../components/BuildingPreview";

import { ARCHETYPES } from "../data/archetypes";
import {
  applyArchetypeDefaults,
  SUGGEST_MATERIALS,
  SUGGEST_WINDOWS,
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
    heatingType: "",
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">
        Конструктор цифрового двойника здания
      </h1>
      <p className="text-sm sm:text-base text-slate-600 mb-6 max-w-3xl">
        Заполни основные параметры здания, климата и эксплуатации —
        TherNest оценит тепловые потери, энергопотребление и предложит
        лучшие энергоэффективные меры.
      </p>

      <Stepper step={step} />

      <div className="mt-8 lg:mt-10 grid gap-6 lg:gap-8 lg:grid-cols-[minmax(0,2.1fr)_minmax(260px,0.9fr)]">
        {/* Левая колонка */}
        <div>
          {step === 1 && (
            <Step1_Building data={data} setData={setData} onNext={() => setStep(2)} />
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

          {step === 6 && <EnergySimPage data={data} onBack={() => setStep(4)} />}

          {step === 7 && <MonteCarloPage data={data} onBack={() => setStep(5)} />}

          {step === 8 && <OptimizationPage data={data} onBack={() => setStep(5)} />}
        </div>

        {/* Правая колонка */}
        {step <= 5 && (
          <div className="lg:sticky lg:top-24 h-fit">
            <BuildingPreview data={data} step={step} />
          </div>
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
    { label: "Неопределённость", num: 7 }, // renamed
    { label: "Улучшения", num: 8 },
  ];

  return (
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
      {steps.map(({ label, num }) => {
        const active = step === num;
        const done = num < step;

        return (
          <div
            key={num}
            className={`flex flex-col items-center p-2 sm:p-3 rounded-xl shadow-sm border text-[10px] sm:text-[11px]
              ${active ? "bg-blue-600 text-white border-blue-600 scale-[1.02]" : ""}
              ${done && !active ? "bg-emerald-500 text-white border-emerald-500" : ""}
              ${!active && !done ? "bg-white border-slate-200 text-slate-700" : ""}
            `}
          >
            <div className="text-xs sm:text-sm font-semibold mb-0.5">{num}</div>
            <div className="truncate">{label}</div>
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
    setData((prev) => applyArchetypeDefaults(key, prev));
  };

  return (
    <div className="flex flex-col gap-6 pt-2 sm:pt-4">
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
          Типовое здание (по желанию)
        </div>

        <select
          value={data.archetypeKey || ""}
          onChange={(e) => handleArchetypeChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">— Не выбрано —</option>
          {ARCHETYPES.map((a) => (
            <option key={a.key} value={a.key}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <InputCard
          title="Этажность"
          value={data.floors}
          onChange={(v) => setData((p) => ({ ...p, floors: v }))}
          placeholder="Например: 9"
        />

        <InputCard
          title="Площадь дома, м²"
          value={data.area}
          onChange={(v) => setData((p) => ({ ...p, area: v }))}
          placeholder="2500"
        />

        <InputCard
          title="Высота потолков, м"
          value={data.height}
          onChange={(v) => setData((p) => ({ ...p, height: v }))}
          placeholder="2.7"
        />

        <InputSuggest
          title="Конструкция стен"
          value={data.wallDescription}
          onChange={(v) => setData((p) => ({ ...p, wallDescription: v }))}
          placeholder="кирпич 380мм + минвата 100мм"
          suggestions={SUGGEST_MATERIALS}
        />
      </div>

      <div className="flex justify-end pt-1">
        <button
          onClick={onNext}
          className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm shadow hover:bg-blue-700"
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
    const t = (text || "").toLowerCase();
    if (t.includes("3") || t.includes("тр") || t.includes("low")) return "std_3ch";
    if (t.includes("дерев")) return "old_wood";
    return "std_2ch";
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2 sm:pt-4">
      <InputSuggest
        title="Тип окон"
        value={data.windowTypeKey}
        onChange={(v) => setData((p) => ({ ...p, windowTypeKey: normalizeWindowType(v) }))}
        placeholder="двухкамерный / трёхкамерный / ПВХ"
        suggestions={SUGGEST_WINDOWS}
      />

      <InputCard
        title="Площадь окон, м²"
        value={data.windowArea}
        onChange={(v) => setData((p) => ({ ...p, windowArea: v }))}
      />

      <InputCard
        title="Инфильтрация, ACH"
        value={data.infiltration}
        onChange={(v) => setData((p) => ({ ...p, infiltration: v }))}
        placeholder="0.3–0.8"
      />

      <InputCard
        title="Герметичность (текстом)"
        value={data.tightness}
        onChange={(v) => setData((p) => ({ ...p, tightness: v }))}
        placeholder="герметичный / высокий / низкий"
      />

      <div className="col-span-2 flex justify-between mt-2">
        <button onClick={onBack} className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white shadow-sm">
          ← Назад
        </button>

        <button onClick={onNext} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white shadow">
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2 sm:pt-4">
      <InputCard
        title="Город"
        value={data.city}
        onChange={(v) => setData((p) => ({ ...p, city: v }))}
        placeholder="Москва, Казань, Екатеринбург..."
      />

      <InputCard
        title="Тип зимы"
        value={data.winterType}
        onChange={(v) => setData((p) => ({ ...p, winterType: v }))}
        placeholder="нормальная / холодная / аномальная"
      />

      <InputCard
        title="Неопределённость, ±°C"
        value={data.uncertainty}
        onChange={(v) => setData((p) => ({ ...p, uncertainty: v }))}
        placeholder="например 3"
      />

      <InputCard
        title="Скорость ветра, м/с"
        value={data.wind}
        onChange={(v) => setData((p) => ({ ...p, wind: v }))}
      />

      <div className="col-span-2 flex justify-between mt-2">
        <button onClick={onBack} className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white shadow-sm">
          ← Назад
        </button>

        <button onClick={onNext} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white shadow">
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
      <InputCard
        title="Температура внутри, °C"
        value={data.tempInside}
        onChange={(v) => setData((p) => ({ ...p, tempInside: v }))}
        placeholder="обычно 20–23"
      />

      <InputCard
        title="Открывание окон"
        value={data.windowsOpening}
        onChange={(v) => setData((p) => ({ ...p, windowsOpening: v }))}
        placeholder="редко / часто / по вечерам..."
      />

      <InputCard
        title="График присутствия жильцов"
        value={data.occupancy}
        onChange={(v) => setData((p) => ({ ...p, occupancy: v }))}
        placeholder="вечер / ночная / всегда дома..."
      />

      <InputCard
        title="Нагрузка от бытовых приборов"
        value={data.appliances}
        onChange={(v) => setData((p) => ({ ...p, appliances: v }))}
        placeholder="низкие / средние / высокие"
      />

      <SelectCard
        title="Чем отапливается здание"
        value={data.heatingType}
        onChange={(v) => setData((p) => ({ ...p, heatingType: v }))}
        options={[
          { value: "electric", label: "Электроотопление" },
          { value: "gas", label: "Газовый котёл" },
          {
            value: "district",
            label: "Центральное теплоснабжение (ТЭЦ/котельная)",
          },
          { value: "hpump", label: "Тепловой насос" },
        ]}
      />

      <div className="col-span-2 flex flex-wrap gap-3 justify-between mt-2">
        <button onClick={onBack} className="px-6 py-3 rounded-xl border border-slate-300 text-sm shadow-sm">
          ← Назад
        </button>

        <div className="flex flex-wrap gap-3">
          <button onClick={onSimulate} className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm shadow">
            Почасовая симуляция (8760 ч)
          </button>

          <button onClick={onNext} className="px-6 py-3 rounded-xl bg-blue-600 text-white text-sm shadow">
            Рассчитать →
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   INPUT UI
------------------------------------------------------- */

function InputCard({ title, value, onChange, placeholder }) {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
      <div className="text-sm text-slate-500 mb-1.5 font-medium">{title}</div>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
      />
    </div>
  );
}

/* -------------------------------------------------------
   SELECT UI
------------------------------------------------------- */

function SelectCard({ title, value, onChange, options }) {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
      <div className="text-sm text-slate-500 mb-1.5 font-medium">{title}</div>

      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none bg-white 
                   focus:ring-2 focus:ring-blue-300 transition"
      >
        <option value="">Выберите...</option>
        {options.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
    </div>
  );
}
