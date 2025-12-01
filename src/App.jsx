// src/App.jsx
import ConstructorPage from "./pages/ConstructorPage";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 text-slate-900 flex flex-col">
      {/* HEADER */}
      <header className="w-full border-b border-slate-200 bg-white/70 backdrop-blur-md sticky top-0 z-40">
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-sky-400 shadow-md" />
            <span className="font-semibold text-lg tracking-tight">
              TherNest
            </span>
          </div>
          <div className="text-xs sm:text-sm text-slate-500">
            Цифровой двойник здания · Beta
          </div>
        </nav>
      </header>

      {/* MAIN */}
      <main className="flex-1 w-full">
        <ConstructorPage />
      </main>
    </div>
  );
}
