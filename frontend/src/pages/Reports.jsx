import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";

export default function Reports() {
  const [dailyRevenue, setDailyRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [dailyRes, monthlyRes, topRes, lowRes] = await Promise.all([
        api.get("/reports/revenue/daily"),
        api.get("/reports/revenue/monthly"),
        api.get("/reports/top-products?limit=10"),
        api.get("/reports/low-stock"),
      ]);

      setDailyRevenue(dailyRes.data.total || 0);
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

  const lowStockCount = lowStock.length;
  const topList = useMemo(() => topProducts.slice(0, 10), [topProducts]);

  if (loading) {
    return <div className="text-slate-500">Raporlar yukleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="grid md:grid-cols-3 gap-4">
        <StatCard title="Gunluk Ciro" value={formatPrice(dailyRevenue)} hint="Bugunun satislari" />
        <StatCard title="Aylik Ciro" value={formatPrice(monthlyRevenue)} hint="Bu ay toplam" />
        <StatCard
          title="Kritik Stok"
          value={`${lowStockCount} urun`}
          hint="Mudahale gereken"
          accent="text-rose-600"
        />
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

function StatCard({ title, value, hint, accent }) {
  return (
    <div className="glass-panel rounded-3xl p-6">
      <div className="text-xs uppercase tracking-wide text-slate-400">{title}</div>
      <div className={`text-2xl font-semibold mt-3 ${accent || "text-slate-900"}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-2">{hint}</div>
    </div>
  );
}
