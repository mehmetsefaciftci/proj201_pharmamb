import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    productId: "",
    quantity: 1,
  });

  async function loadData() {
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
      alert("Satis verisi yuklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createSale(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/sales", {
        productId: Number(form.productId),
        quantity: Number(form.quantity),
      });

      setForm({ productId: "", quantity: 1 });
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Satis basarisiz (stok kontrol edin)");
    } finally {
      setSubmitting(false);
    }
  }

  const totals = useMemo(() => {
    const revenue = sales.reduce((sum, sale) => {
      const unitPrice = Number(sale.unitPrice ?? sale.product?.price ?? 0);
      return sum + unitPrice * sale.quantity;
    }, 0);

    const today = new Date().toDateString();
    const todaySales = sales.filter(
      (sale) => new Date(sale.saleDate).toDateString() === today
    );

    return {
      revenue,
      todaySales: todaySales.length,
    };
  }, [sales]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Gunluk Satis" value={`${totals.todaySales} islem`} hint="Kasa akisi canli takipte." />
        <StatCard title="Toplam Ciro" value={formatPrice(totals.revenue)} hint="Tum satislarin toplami." accent="text-emerald-600" />
        <StatCard title="Ortalama Sepet" value={sales.length ? formatPrice(totals.revenue / sales.length) : formatPrice(0)} hint="Islem basina ortalama" />
      </section>

      <section className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
        <div className="glass-panel rounded-3xl p-6">
          <div className="section-title">Yeni Satis</div>
          <p className="text-sm text-slate-500 mt-2">Barkod veya urun secerek hizli satis olusturun.</p>
          <form
            onSubmit={createSale}
            className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3"
          >
            <select
              className="border border-slate-200 rounded-2xl px-3 py-2"
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              required
            >
              <option value="">Urun sec</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.stock} adet)
                </option>
              ))}
            </select>

            <input
              type="number"
              min="1"
              className="border border-slate-200 rounded-2xl px-3 py-2"
              placeholder="Adet"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
            />

            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-emerald-600 text-white px-4 py-2 font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {submitting ? "Isleniyor..." : "Satis yap"}
            </button>
          </form>
        </div>

        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="section-title">Kasiyer Ozeti</div>
          <SummaryRow label="Gunluk islem" value={`${totals.todaySales} adet`} />
          <SummaryRow label="Gunun cirosu" value={formatPrice(totals.revenue)} accent="text-emerald-600" />
          <SummaryRow label="Performans" value="Hedefin ustunde" />
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600">
            AI, satis temposuna gore vardiya planini optimize eder.
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div className="section-title">Satis Gecmisi</div>
          <span className="chip">Tum hareketler</span>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500 mt-4">Satislar yukleniyor...</p>
        ) : sales.length === 0 ? (
          <p className="text-sm text-slate-500 mt-4">Henuz satis yok</p>
        ) : (
          <div className="mt-4 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="pb-3">Urun</th>
                  <th className="pb-3">Adet</th>
                  <th className="pb-3">Tarih</th>
                  <th className="pb-3">Tutar</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-t border-slate-100">
                    <td className="py-3 font-semibold text-slate-900">{sale.product?.name}</td>
                    <td>{sale.quantity}</td>
                    <td>{new Date(sale.saleDate).toLocaleString("tr-TR")}</td>
                    <td>{formatPrice(Number(sale.unitPrice ?? sale.product?.price ?? 0) * sale.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
