import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";

export default function Reports() {
  const [dailyRevenue, setDailyRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dailyPassword, setDailyPassword] = useState("");
  const [dailyUnlocked, setDailyUnlocked] = useState(false);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [rangeLoading, setRangeLoading] = useState(false);
  const [rangeError, setRangeError] = useState("");
  const [rangeReport, setRangeReport] = useState(null);

  async function loadData() {
    setLoading(true);
    try {
      const [monthlyRes, topRes, lowRes] = await Promise.all([
        api.get("/reports/revenue/monthly"),
        api.get("/reports/top-products?limit=10"),
        api.get("/reports/low-stock"),
      ]);

      setMonthlyRevenue(monthlyRes.data.total || 0);
      setTopProducts(topRes.data || []);
      setLowStock(lowRes.data || []);
    } catch (error) {
      console.error(error);
      alert("Rapor verileri yuklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function unlockDailyRevenue(e) {
    e.preventDefault();
    setDailyLoading(true);
    setDailyError("");
    try {
      const res = await api.post("/sales/daily-summary/secure", {
        password: dailyPassword,
      });
      setDailyRevenue(res.data.totalRevenue || 0);
      setDailyUnlocked(true);
      setDailyPassword("");
    } catch (error) {
      console.error(error);
      setDailyError("Parola hatali");
      setDailyUnlocked(false);
    } finally {
      setDailyLoading(false);
    }
  }

  async function loadRangeReport(e) {
    e.preventDefault();
    setRangeLoading(true);
    setRangeError("");
    setRangeReport(null);

    try {
      const res = await api.get("/reports/sales-range", {
        params: { start: rangeStart, end: rangeEnd },
      });
      setRangeReport(res.data);
    } catch (error) {
      console.error(error);
      setRangeError("Tarih bazli rapor alinamadi");
    } finally {
      setRangeLoading(false);
    }
  }

  const lowStockCount = lowStock.length;
  const topList = useMemo(() => topProducts.slice(0, 10), [topProducts]);

  if (loading) {
    return <div className="text-slate-500">Raporlar yukleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="grid md:grid-cols-3 gap-4">
        <StatCard
          title="Gunluk Ciro"
          value={dailyUnlocked ? formatPrice(dailyRevenue) : "Parola gerekli"}
          hint="Bugunun satislari"
        />
        <StatCard title="Aylik Ciro" value={formatPrice(monthlyRevenue)} hint="Bu ay toplam" />
        <StatCard
          title="Kritik Stok"
          value={`${lowStockCount} urun`}
          hint="Mudahale gereken"
          accent="text-rose-600"
        />
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <div className="section-title">Gunluk Ciro Erisimi</div>
        <p className="text-sm text-slate-500 mt-2">
          Gunluk ciro bilgisi icin eczaci sifresini girin.
        </p>
        <form onSubmit={unlockDailyRevenue} className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            type="password"
            className="flex-1 border border-slate-200 rounded-2xl px-3 py-2 text-sm"
            placeholder="Eczaci sifresi"
            value={dailyPassword}
            onChange={(e) => setDailyPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={dailyLoading}
            className="rounded-2xl bg-teal-600 text-white px-4 py-2 font-semibold hover:bg-teal-700 transition disabled:opacity-50"
          >
            {dailyLoading ? "Kontrol..." : "Goster"}
          </button>
        </form>
        {dailyError && <div className="mt-2 text-xs text-rose-600">{dailyError}</div>}
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <div className="section-title">Tarih Bazli Satis Raporu</div>
        <p className="text-sm text-slate-500 mt-2">
          Baslangic ve bitis tarihini secerek satis raporunu alin.
        </p>
        <form onSubmit={loadRangeReport} className="mt-4 grid md:grid-cols-[1fr_1fr_auto] gap-3">
          <input
            type="date"
            className="border border-slate-200 rounded-2xl px-3 py-2 text-sm"
            value={rangeStart}
            onChange={(e) => setRangeStart(e.target.value)}
            required
          />
          <input
            type="date"
            className="border border-slate-200 rounded-2xl px-3 py-2 text-sm"
            value={rangeEnd}
            onChange={(e) => setRangeEnd(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={rangeLoading}
            className="rounded-2xl bg-indigo-600 text-white px-4 py-2 font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {rangeLoading ? "Hazirlaniyor..." : "Raporu getir"}
          </button>
        </form>
        {rangeError && <div className="mt-2 text-xs text-rose-600">{rangeError}</div>}

        {rangeReport && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="chip">Toplam satis: {rangeReport.totalSales}</span>
              <span className="chip">Ciro: {formatPrice(rangeReport.totalRevenue)}</span>
              <span className="chip">
                Tamamlanan: {rangeReport.statusCounts?.COMPLETED || 0}
              </span>
              <span className="chip">
                Iptal: {rangeReport.statusCounts?.CANCELLED || 0}
              </span>
              <span className="chip">
                Iade: {rangeReport.statusCounts?.REFUNDED || 0}
              </span>
            </div>

            {rangeReport.sales?.length === 0 ? (
              <p className="text-sm text-slate-500">Secilen tarihte satis yok.</p>
            ) : (
              <div className="mt-3 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-500">
                    <tr>
                      <th className="pb-3">Tarih</th>
                      <th className="pb-3">Urun</th>
                      <th className="pb-3">Adet</th>
                      <th className="pb-3">Tutar</th>
                      <th className="pb-3">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700">
                    {rangeReport.sales.map((sale) => {
                      const firstItem = sale.items?.[0];
                      return (
                        <tr key={sale.id} className="border-t border-slate-100">
                          <td className="py-3">
                            {new Date(sale.createdAt).toLocaleString("tr-TR")}
                          </td>
                          <td className="font-semibold text-slate-900">
                            {firstItem?.product?.name || "Coklu urun"}
                          </td>
                          <td>{firstItem?.quantity || "-"}</td>
                          <td>{formatPrice(Number(sale.total || 0))}</td>
                          <td>{statusLabel(sale.status)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-3xl p-6">
          <div className="section-title">En Cok Satilanlar</div>
          {topList.length === 0 ? (
            <p className="text-sm text-slate-500 mt-4">Yeterli satis verisi yok.</p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {topList.map((item) => (
                <li key={item.name} className="flex justify-between">
                  <span>{item.name}</span>
                  <span className="font-semibold text-slate-900">{item.quantity} adet</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-panel rounded-3xl p-6 space-y-3">
          <div className="section-title">Kritik Stok Listesi</div>
          {lowStockCount === 0 ? (
            <p className="text-sm text-slate-500">Kritik stok bulunmuyor.</p>
          ) : (
            lowStock.slice(0, 6).map((product) => (
              <div key={product.id} className="flex items-center justify-between text-sm text-slate-600">
                <span>{product.name}</span>
                <span className="font-semibold text-rose-600">{product.stock} adet</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function formatPrice(value) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value);
}

function statusLabel(status) {
  if (status === "CANCELLED") return "Iptal";
  if (status === "REFUNDED") return "Iade";
  return "Tamamlandi";
}

function StatCard({ title, value, hint, accent }) {
  return (
    <div className="glass-panel rounded-3xl p-6">
      <div className="text-xs uppercase tracking-wide text-slate-400">{title}</div>
      <div className={`text-2xl font-semibold mt-3 ${accent || "text-slate-900"}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-2">{hint}</div>
    </div>
  );
}
