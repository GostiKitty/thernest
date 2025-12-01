export default function GradientLegend({ min, max, label }) {
  return (
    <div className="text-xs text-slate-600">
      <div className="flex items-center gap-3">
        <div
          className="h-3 w-40 rounded-full"
          style={{
            background:
              "linear-gradient(to right, rgb(59,130,246), rgb(239,68,68))",
          }}
        />
        <div className="flex flex-col">
          <span>{label}</span>
          <span>
            {min.toFixed(1)}°C → {max.toFixed(1)}°C
          </span>
        </div>
      </div>
    </div>
  );
}
