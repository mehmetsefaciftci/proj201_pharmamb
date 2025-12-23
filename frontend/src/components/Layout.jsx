import React from "react";

export default function Layout({ page, setPage, children }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600" />
            <div>
              <div className="text-lg font-semibold text-slate-900">PharmaMB</div>
              <div className="text-xs text-slate-500">Pharmacy Management</div>
            </div>
          </div>

          <nav className="flex gap-2">
            <button
              onClick={() => setPage("products")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                page === "products"
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setPage("sales")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                page === "sales"
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Sales
            </button>
            <button
  onClick={() => setPage("dashboard")}
  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
    page === "dashboard"
      ? "bg-indigo-600 text-white shadow"
      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
  }`}
>
  Dashboard
</button>

<button
  onClick={() => {
    localStorage.removeItem("pharmamb_user");
    window.location.reload();
  }}
  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-600 hover:bg-red-200"
>
  Logout
</button>


          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">{children}</main>
    </div>
  );
}
