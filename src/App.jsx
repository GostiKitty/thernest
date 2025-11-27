// src/App.jsx
import { useState } from "react";

// страницы
import ConstructorPage from "./pages/ConstructorPage";
import ResultsPage from "./pages/ResultsPage";
import MonteCarloPage from "./pages/MonteCarloPage";

export default function App() {
  const [page, setPage] = useState("constructor");
  const [data, setData] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 text-slate-900 flex flex-col">

      {/* ----------- HEADER ----------- */}
      <header className="w-full border-b border-slate-200 bg-white/70 backdrop-blur-md sticky top-0 z-40">
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-sky-400 shadow-md" />
            <span className="font-semibold text-lg tracking-tight">
              TherNest
            </span>
          </div>
        </nav>
      </header>

      {/* ----------- MAIN AREA ----------- */}
      <main className="flex-1 w-full">

        {/* 1) Конструктор */}
        {page === "constructor" && (
          <ConstructorPage
            onNext={(filledData) => {
              setData(filledData);
              setPage("results");
            }}
          />
        )}

        {/* 2) Результаты */}
        {page === "results" && (
          <ResultsPage
            data={data}
            onBack={() => setPage("constructor")}
            onMonteCarlo={() => setPage("monte")}
          />
        )}

        {/* 3) Монте-Карло */}
        {page === "monte" && (
          <MonteCarloPage
            data={data}
            onBack={() => setPage("results")}
          />
        )}

      </main>
    </div>
  );
}
