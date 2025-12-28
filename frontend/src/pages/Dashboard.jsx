import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [productsRes, salesRes] = await Promise.all([
        api.get("/products"),
        api.get("/sales"),
      ]);

      setProducts(productsRes.data);
      setSales(salesRes.data);
    } catch (err) {
      console.error(err);
      alert("Dashboard verisi yuklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const lowStock = products.filter((p) => p.stock <= p.lowStockThreshold);

    const now = new Date();
    const soonThreshold = new Date();
    soonThreshold.setDate(now.getDate() + 45);

    const expiringSoon = products.filter(
      (p) => p.expiryDate && new Date(p.expiryDate) <= soonThreshold
    );

    const last30 = new Date();
    last30.setDate(now.getDate() - 30);
    const lastMonthSales = sales.filter(
      (s) => s.status === "COMPLETED" && new Date(s.createdAt) >= last30
    );

    const totalRevenue = lastMonthSales.reduce((sum, s) => {
      return sum + Number(s.total || 0);
    }, 0);

    const today = new Date().toDateString();
    const todaySales = sales.filter(
      (s) => s.status === "COMPLETED" && new Date(s.createdAt).toDateString() === today
    );

    return {
      totalProducts,
      totalStock,
      lowStock,
      expiringSoon,
      totalRevenue,
      todaySales,
    };
  }, [products, sales]);

  const insights = useMemo(() => {
    const items = [];
    if (stats.lowStock.length > 0) {
      items.push(`Kritik stokta ${stats.lowStock.length} urun var.`);
    }

    if (stats.expiringSoon.length > 0) {
      items.push(`${stats.expiringSoon.length} urunun SKT'si 45 gun icinde.`);
    }

    if (stats.todaySales.length > 0) {
      items.push("Bugun satis hareketi devam ediyor.");
    }

    if (items.length === 0) {
      items.push("Bugun kritik uyari yok. Tum sistemler stabil.");
    }

    return items;
  }, [stats]);

  if (loading) {
    return <div className="text-slate-500">Kontrol merkezi yukleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Toplam Urun" value={stats.totalProducts} hint="Stok kartlari" />
        <StatCard title="Toplam Stok" value={stats.totalStock} hint="Mevcut adet" />
        <StatCard
          title="Kritik Stok"
          value={stats.lowStock.length}
          hint="Kritik seviyedeki urunler"
          accent="text-rose-600"
        />
        <StatCard
          title="30 Gun Ciro"
          value={formatPrice(stats.totalRevenue)}
          hint="Net satis"
          accent="text-emerald-600"
        />
      </section>

      <section className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className="glass-panel rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="section-title">Oncelikli Notlar</div>
            <span className="chip">Gunun ozeti</span>
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            {insights.map((item, index) => (
              <div key={index} className="flex gap-3">
                <div className="h-2.5 w-2.5 mt-1.5 rounded-full bg-teal-500" />
                <p>{item}</p>
              </div>
            ))}
          </div>

          <div className="soft-divider" />

          <div className="grid sm:grid-cols-2 gap-4">
            <HighlightCard title="Bugun" value={`${stats.todaySales.length} satis`} hint="Kasa performansi" />
            <HighlightCard title="Senkron" value="%99.8" hint="Bulut calisma durumu" />
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 space-y-5">
          <div className="section-title">Operasyon Nabzi</div>
          <MetricRow label="Kritik stok listesi" value={`${stats.lowStock.length} urun`} accent="text-rose-600" />
          <MetricRow label="SKT riski" value={`${stats.expiringSoon.length} urun`} accent="text-amber-600" />
          <MetricRow label="Gunluk satis" value={`${stats.todaySales.length} islem`} />
          <MetricRow label="Senkron durumu" value="Aktif" />
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-400">Gunun plan</div>
            <div className="text-sm text-slate-600 mt-2">
              Kritik stok urunleri icin manuel tedarik kontrolu ve 17:30 stok sayimi.
            </div>
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title">Son Satislar</div>
            <span className="chip">Canli akista 5 kayit</span>
          </div>

          {sales.length === 0 ? (
            <div className="text-sm text-slate-500">Henuz satis yok.</div>
          ) : (
            <div className="space-y-3">
              {sales.slice(0, 5).map((sale) => (
                <div
                  key={sale.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-2xl bg-white/70 px-4 py-3"
                >
                  <div>
                    <div className="font-semibold text-slate-900">
                      {sale.items?.[0]?.product?.name || "Coklu urun"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(sale.createdAt).toLocaleString("tr-TR")}
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 flex items-center gap-2">
                    <span>{sale.items?.[0]?.quantity || "-"} adet</span>
                    {sale.status === "CANCELLED" && (
                      <span className="text-xs text-rose-600">(Iptal edildi)</span>
                    )}
                    {sale.status === "REFUNDED" && (
                      <span className="text-xs text-amber-600">(Iade edildi)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel rounded-3xl p-6">
          <div className="section-title">Kritik Uyarilar</div>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {stats.lowStock.slice(0, 4).map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="font-semibold text-slate-800">{item.name}</div>
                <span className="pill bg-rose-100 text-rose-700">{item.stock}</span>
              </div>
            ))}
            {stats.lowStock.length === 0 && (
              <div className="text-sm text-slate-500">Tum stoklar guvende.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value, hint, accent }) {
  return (
    <div className="glass-panel rounded-3xl p-5">
      <div className="text-xs uppercase tracking-wide text-slate-400">{title}</div>
      <div className={`text-2xl font-semibold mt-2 ${accent || "text-slate-900"}`}>
        {value}
      </div>
      <div className="text-xs text-slate-500 mt-1">{hint}</div>
    </div>
  );
}

function HighlightCard({ title, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400">{title}</div>
      <div className="text-2xl font-semibold text-slate-900 mt-2">{value}</div>
      <p className="text-xs text-slate-500 mt-1">{hint}</p>
    </div>
  );
}

function MetricRow({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between text-sm text-slate-600">
      <span>{label}</span>
      <span className={`font-semibold ${accent || "text-slate-900"}`}>{value}</span>
    </div>
  );
}

function formatPrice(value) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value);
}
