import { useState, useEffect } from "react";

export default function InputSuggest({
  title,
  value,
  onChange,
  suggestions = [],
  placeholder = "",
}) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    const query = value.toLowerCase();

    const f = suggestions.filter((s) =>
      s.toLowerCase().includes(query)
    );

    setFiltered(f.slice(0, 6)); // показываем до 6
  }, [value, suggestions]);

  function handleSelect(s) {
    onChange(s);
    setOpen(false);
  }

  return (
    <div className="relative">
      <div className="text-sm text-slate-500 mb-1 font-medium">
        {title}
      </div>

      <input
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        placeholder={placeholder}
        className="
          w-full rounded-xl border border-slate-300
          px-3 py-2 text-sm outline-none
          focus:border-blue-500
          focus:ring-2 focus:ring-blue-300/50
          transition
        "
      />

      {/* ВЫПАДАЮЩИЕ ПОДСКАЗКИ */}
      {open && filtered.length > 0 && (
        <div className="
          absolute left-0 right-0 mt-1 bg-white shadow-xl
          rounded-xl border border-slate-200 z-20 p-1
        ">
          {filtered.map((s) => (
            <div
              key={s}
              onClick={() => handleSelect(s)}
              className="
                px-3 py-2 text-sm rounded-lg cursor-pointer
                hover:bg-blue-50 hover:text-blue-700
                active:bg-blue-100 transition
              "
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
