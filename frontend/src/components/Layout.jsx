import React from "react";

const navItems = [
  {
    id: "dashboard",
    label: "Genel Bakis",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
        <path strokeWidth="1.6" d="M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z" />
      </svg>
    ),
  },
  {
    id: "products",
    label: "Urunler",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
        <path strokeWidth="1.6" d="M4 7l8-4 8 4v10l-8 4-8-4z" />
        <path strokeWidth="1.6" d="M4 7l8 4 8-4" />
      </svg>
    ),
  },
  {
    id: "sales",
    label: "Satislar",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
        <path strokeWidth="1.6" d="M3 4h2l2.2 10.5a2 2 0 0 0 2 1.5h7.6a2 2 0 0 0 2-1.6L20 8H7" />
        <path strokeWidth="1.6" d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
      </svg>
    ),
  },
  {
    id: "orders",
    label: "Siparisler",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
        <path strokeWidth="1.6" d="M3 7h11v10H3z" />
        <path strokeWidth="1.6" d="M14 10h4l3 3v4h-7z" />
        <path strokeWidth="1.6" d="M7 17a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM18 17a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
      </svg>
    ),
  },
  {
    id: "prescriptions",
    label: "E-Recete",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
        <path strokeWidth="1.6" d="M6 3h9l3 3v15H6z" />
        <path strokeWidth="1.6" d="M9 10h6M9 14h6M9 18h4" />
      </svg>
    ),
  },
  {
    id: "reports",
    label: "Raporlar",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
        <path strokeWidth="1.6" d="M4 19h16" />
        <path strokeWidth="1.6" d="M7 16V8m5 8V5m5 11v-6" />
      </svg>
    ),
  },
];

export default function Layout({ page, setPage, children, user, onLogout }) {
  const displayName = user?.name || user?.email || "Kullanici";
  const activeLabel = navItems.find((item) => item.id === page)?.label || "Panel";
  const todayLabel = new Date().toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="app-shell">
      <div className="max-w-[1400px] mx-auto p-4 lg:p-8">
        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          <aside className="glass-panel rounded-3xl p-6 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold">
                PM
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-900">PharmaMB</div>
                <div className="text-xs text-slate-500">Bulut Eczane Otomasyonu</div>
              </div>
            </div>

            <div className="space-y-2">
              {navItems.map((item) => {
                const isActive = page === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setPage(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                      isActive
                        ? "bg-teal-600 text-white shadow"
                        : "text-slate-700 hover:bg-white/70"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto space-y-4">
              <div className="glass-panel rounded-2xl p-4">
                <div className="text-xs text-slate-500">Aktif kullanici</div>
                <div className="font-semibold text-slate-900 mt-1">{displayName}</div>
                <div className="chip mt-3">Bulut senkron aktif</div>
              </div>

              <button
                onClick={onLogout}
                className="w-full rounded-2xl px-4 py-3 text-sm font-semibold bg-rose-100 text-rose-700 hover:bg-rose-200 transition"
              >
                Guvenli cikis
              </button>
            </div>
          </aside>

          <div className="flex flex-col gap-6">
            <header className="glass-panel rounded-3xl p-5 md:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">PharmaMB Cloud</div>
                <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mt-1">
                  {activeLabel}
                </h1>
                <p className="text-sm text-slate-500 mt-2">
                  Stok, satis, recete ve siparisler tek panelde senkron calisir.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="chip">{todayLabel}</span>
                  <span className="chip">Bulut calisiyor</span>
                  <span className="chip">{user?.pharmacyName || "Demo Eczane"}</span>
                </div>
                <label className="relative">
                  <input
                    type="text"
                    placeholder="Stok, barkod veya recete ara"
                    className="w-full sm:w-64 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </label>
                <button
                  onClick={() => setPage("sales")}
                  className="rounded-2xl bg-teal-600 text-white px-5 py-2 text-sm font-semibold hover:bg-teal-700 transition"
                >
                  Yeni satis
                </button>
              </div>
            </header>

            <div className="flex flex-wrap gap-3 md:hidden">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  className={`pill ${
                    page === item.id
                      ? "bg-teal-600 text-white"
                      : "bg-white/80 text-slate-600"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <main className="space-y-6">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
