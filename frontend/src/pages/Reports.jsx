import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";

export default function Reports() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [productsRes, salesRes] = await Promise.all([
        api.get("/products"),
        api.get("/sales"),
      ]);
      setProducts(productsRes.data);
      setSales(salesRes.data);
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

  const weeklySeries = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const label = date.toLocaleDateString("tr-TR", { weekday: "short" });
      return {
        dateKey: date.toDateString(),
        label,
      };
    });

    return days.map((day) => {
      const daySales = sales.filter(
        (sale) => new Date(sale.saleDate).toDateString() === day.dateKey
      );
      const total = daySales.reduce((sum, sale) => {
        const unitPrice = Number(sale.unitPrice ?? sale.product?.price ?? 0);
        return sum + unitPrice * sale.quantity;
      }, 0);
      return { ...day, total };
    });
  }, [sales]);

  const topProducts = useMemo(() => {
    const counter = new Map();
    sales.forEach((sale) => {
      const name = sale.product?.name || "Bilinmeyen";
      counter.set(name, (counter.get(name) || 0) + sale.quantity);
    });
    return Array.from(counter.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [sales]);

  if (loading) {
    return <div className="text-slate-500">Raporlar yukleniyor...</div>;
  }

  const maxWeekly = Math.max(...weeklySeries.map((item) => item.total), 1);

  return (
    <div className="space-y-6">
      <section className="grid md:grid-cols-3 gap-4">
        <StatCard title="Toplam Ciro" value={formatPrice(sales.reduce((sum, sale) => sum + Number(sale.unitPrice ?? sale.product?.price ?? 0) * sale.quantity, 0))} hint="Tumulatif satislar" />
        <StatCard title="Toplam Urun" value={`${products.length} urun`} hint="Aktif stok karti" />
        <StatCard title="Kritik Stok" value={`${products.filter((product) => product.stock <= 5).length} urun`} hint="Mudahale gereken" accent="text-rose-600" />
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div className="section-title">Haftalik Ciro</div>
          <span className="chip">Son 7 gun</span>
        </div>
        <div className="mt-6 flex items-end gap-3 h-40">
          {weeklySeries.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <div
                className="w-8 rounded-2xl bg-teal-500/80"
                style={{ height: `${(item.total / maxWeekly) * 140}px` }}
                title={formatPrice(item.total)}
              />
              <div className="text-xs text-slate-500">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-3xl p-6">
          <div className="section-title">En cok satilanlar</div>
          {topProducts.length === 0 ? (
            <p className="text-sm text-slate-500 mt-4">Yeterli satis verisi yok.</p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {topProducts.map(([name, qty]) => (
                <li key={name} className="flex justify-between">
                  <span>{name}</span>
                  <span className="font-semibold text-slate-900">{qty} adet</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-panel rounded-3xl p-6 space-y-3">
          <div className="section-title">Stok Bileseni</div>
          <SummaryRow label="Toplam urun" value={products.length} />
          <SummaryRow
            label="Kritik stok"
            value={products.filter((product) => product.stock <= 5).length}
            accent="text-rose-600"
          />
          <SummaryRow
            label="SKT riski"
            value={
              products.filter(
                (product) =>
                  product.expiryDate &&
                  new Date(product.expiryDate) <
                    new Date(Date.now() + 1000 * 60 * 60 * 24 * 45)
              ).length
            }
            accent="text-amber-600"
          />
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600">
            AI raporlama, stok ve satis trendlerini gunluk olarak optimizasyon icin hazirlar.
          </div>
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

function SummaryRow({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between text-sm text-slate-600">
      <span>{label}</span>
      <span className={`font-semibold ${accent || "text-slate-900"}`}>{value}</span>
    </div>
  );
}
