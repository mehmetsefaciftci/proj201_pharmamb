import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({ totalSales: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    barcode: "",
    productId: "",
    quantity: 1,
    paymentType: "CASH",
  });

  async function loadData() {
    setLoading(true);
    try {
      const [productsRes, salesRes, summaryRes] = await Promise.all([
        api.get("/products"),
        api.get("/sales"),
        api.get("/sales/daily-summary"),
      ]);

      setProducts(productsRes.data);
      setSales(salesRes.data);
      setSummary(summaryRes.data);
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
      const item = form.barcode
        ? { barcode: form.barcode, quantity: Number(form.quantity) }
        : { productId: Number(form.productId), quantity: Number(form.quantity) };

      await api.post("/sales", {
        items: [item],
        paymentType: form.paymentType,
      });

      setForm({ barcode: "", productId: "", quantity: 1, paymentType: "CASH" });
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Satis basarisiz (stok kontrol edin)");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateSaleStatus(saleId, action) {
    try {
      await api.post(`/sales/${saleId}/${action}`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Islem basarisiz");
    }
  }

  const totals = useMemo(() => {
    const revenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    return {
      revenue,
      todaySales: summary.totalSales || 0,
    };
  }, [sales, summary]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Gunluk Satis" value={`${totals.todaySales} islem`} hint="Bugunun ozet hareketi." />
        <StatCard
          title="Toplam Ciro"
          value={formatPrice(totals.revenue)}
          hint="Tum satislarin toplami."
          accent="text-emerald-600"
        />
        <StatCard
          title="Ortalama Sepet"
          value={sales.length ? formatPrice(totals.revenue / sales.length) : formatPrice(0)}
          hint="Islem basina ortalama"
        />
      </section>

      <section className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
        <div className="glass-panel rounded-3xl p-6">
          <div className="section-title">Yeni Satis</div>
          <p className="text-sm text-slate-500 mt-2">
            Barkod okutabilir veya listeden urun secerek satis yapabilirsiniz.
          </p>
          <form onSubmit={createSale} className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              className="border border-slate-200 rounded-2xl px-3 py-2"
              placeholder="Barkod"
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value, productId: "" })}
            />

            <select
              className="border border-slate-200 rounded-2xl px-3 py-2"
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value, barcode: "" })}
              required={!form.barcode}
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

            <select
              className="border border-slate-200 rounded-2xl px-3 py-2"
              value={form.paymentType}
              onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
            >
              <option value="CASH">Nakit</option>
              <option value="CARD">Kart</option>
              <option value="OTHER">Diger</option>
            </select>

            <button
              type="submit"
              disabled={submitting}
              className="md:col-span-4 rounded-2xl bg-emerald-600 text-white px-4 py-2 font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {submitting ? "Isleniyor..." : "Satis yap"}
            </button>
          </form>
        </div>

        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="section-title">Gunluk Ozet</div>
          <SummaryRow label="Gunluk islem" value={`${summary.totalSales || 0} adet`} />
          <SummaryRow
            label="Gunun cirosu"
            value={formatPrice(summary.totalRevenue || 0)}
            accent="text-emerald-600"
          />
          <SummaryRow label="Kasa durumu" value="Canli izleme" />
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600">
            Iptal ve iade islemleri bu ekrandan yapilir.
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div className="section-title">Satis Gecmisi</div>
          <span className="chip">Son islemler</span>
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
                  <th className="pb-3">Durum</th>
                  <th className="pb-3">Islem</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {sales.map((sale) => {
                  const firstItem = sale.items?.[0];
                  return (
                    <tr key={sale.id} className="border-t border-slate-100">
                      <td className="py-3 font-semibold text-slate-900">
                        {firstItem?.product?.name || "Coklu urun"}
                      </td>
                      <td>{firstItem?.quantity || "-"}</td>
                      <td>{new Date(sale.createdAt).toLocaleString("tr-TR")}</td>
                      <td>{formatPrice(Number(sale.total || 0))}</td>
                      <td>{statusLabel(sale.status)}</td>
                      <td>
                        {sale.status === "COMPLETED" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateSaleStatus(sale.id, "cancel")}
                              className="text-xs px-2 py-1 rounded-xl bg-rose-100 text-rose-700"
                            >
                              Iptal
                            </button>
                            <button
                              onClick={() => updateSaleStatus(sale.id, "refund")}
                              className="text-xs px-2 py-1 rounded-xl bg-amber-100 text-amber-700"
                            >
                              Iade
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Kapali</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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

function SummaryRow({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between text-sm text-slate-600">
      <span>{label}</span>
      <span className={`font-semibold ${accent || "text-slate-900"}`}>{value}</span>
    </div>
  );
}
