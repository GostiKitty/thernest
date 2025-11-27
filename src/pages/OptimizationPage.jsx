import { computeImprovements } from "../core/optimizationEngine";

export default function OptimizationPage({ data, onBack }) {
  const results = computeImprovements(data);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <button
        onClick={onBack}
        className="px-4 py-2 mb-6 rounded-xl border border-slate-300"
      >
        ← Назад
      </button>

      <h1 className="text-3xl font-semibold mb-6 tracking-tight">
        ТОП-5 улучшений (окупаемость)
      </h1>

      <div className="flex flex-col gap-6">
        {results.map((r, idx) => (
          <div
            key={idx}
            className="p-6 bg-white shadow rounded-2xl border flex flex-col gap-2"
          >
            <div className="text-xl font-semibold">{r.name}</div>
            <div className="text-slate-600">
              • Стоимость:{" "}
              <span className="font-medium">
                {Math.round(r.cost).toLocaleString("ru-RU")} ₽
              </span>
            </div>

            <div className="text-slate-600">
              • Экономия энергии:{" "}
              <span className="font-medium">
                {Math.round(r.saving_kWh).toLocaleString("ru-RU")} кВт·ч/год
              </span>
            </div>

            <div className="text-slate-600">
              • Экономия денег:{" "}
              <span className="font-medium">
                {Math.round(r.savingRub).toLocaleString("ru-RU")} ₽/год
              </span>
            </div>

            <div className="text-emerald-600 text-lg font-bold mt-2">
              Окупаемость: {r.payback.toFixed(1)} лет
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
