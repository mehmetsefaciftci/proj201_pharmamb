import React, { useEffect, useMemo, useState, useCallback } from "react";
import api from "../services/api";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);
  const [showExpiring, setShowExpiring] = useState(false);

  const [form, setForm] = useState({
    name: "",
    barcode: "",
    price: "",
    stock: "",
    expiryDate: "",
  });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (error) {
      console.error(error);
      alert("Urunler yuklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  async function addProduct(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/products", {
        name: form.name,
        barcode: form.barcode,
        price: Number(form.price),
        stock: Number(form.stock),
        expiryDate: form.expiryDate
          ? new Date(form.expiryDate).toISOString()
          : null,
      });

      setForm({
        name: "",
        barcode: "",
        price: "",
        stock: "",
        expiryDate: "",
      });

      await loadProducts();
    } catch (error) {
      console.error(error);
      alert("Urun eklenemedi");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery =
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.barcode.toLowerCase().includes(query.toLowerCase());

      const lowStock = !showLowStock || product.stock <= 5;
      const expiring =
        !showExpiring ||
        (product.expiryDate &&
          new Date(product.expiryDate) <
            new Date(Date.now() + 1000 * 60 * 60 * 24 * 45));

      return matchesQuery && lowStock && expiring;
    });
  }, [products, query, showLowStock, showExpiring]);

  const totals = useMemo(() => {
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const lowStock = products.filter((p) => p.stock <= 5).length;
    return { totalStock, lowStock };
  }, [products]);

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl p-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <div className="section-title">Stok Merkezi</div>
            <p className="text-sm text-slate-500">
              Urun kartlarini, barkodlari ve SKT planlarini tek panelde yonetin.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="chip">Toplam stok: {totals.totalStock}</span>
            <span className="chip">Kritik: {totals.lowStock}</span>
            <span className="chip">Aktif urun: {products.length}</span>
          </div>
        </div>

        <div className="mt-5 grid lg:grid-cols-[1fr_auto] gap-3">
          <input
            placeholder="Urun veya barkod ara"
            className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowLowStock((prev) => !prev)}
              className={`pill ${showLowStock ? "bg-rose-100 text-rose-700" : "bg-white/80 text-slate-600"}`}
            >
              Kritik stok
            </button>
            <button
              onClick={() => setShowExpiring((prev) => !prev)}
              className={`pill ${showExpiring ? "bg-amber-100 text-amber-700" : "bg-white/80 text-slate-600"}`}
            >
              SKT yaklasan
            </button>
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
        <div className="glass-panel rounded-3xl p-6">
          <div className="section-title">Yeni Urun Karti</div>
          <form
            onSubmit={addProduct}
            className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3"
          >
            <input
              className="border border-slate-200 rounded-2xl px-3 py-2"
              placeholder="Urun adi"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <input
              className="border border-slate-200 rounded-2xl px-3 py-2"
              placeholder="Barkod"
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              required
            />

            <input
              className="border border-slate-200 rounded-2xl px-3 py-2"
              type="number"
              step="0.01"
              placeholder="Fiyat (TRY)"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />

            <input
              className="border border-slate-200 rounded-2xl px-3 py-2"
              type="number"
              min="0"
              placeholder="Stok"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              required
            />

            <input
              className="border border-slate-200 rounded-2xl px-3 py-2"
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            />

            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-teal-600 text-white px-4 py-2 font-semibold hover:bg-teal-700 transition disabled:opacity-50"
            >
              {submitting ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </form>
        </div>

        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="section-title">Hizli Ozet</div>
          <SummaryRow label="Kritik stok listesi" value={`${totals.lowStock} urun`} accent="text-rose-600" />
          <SummaryRow label="SKT riski (45 gun)" value={`${products.filter((p) => p.expiryDate && new Date(p.expiryDate) < new Date(Date.now() + 1000 * 60 * 60 * 24 * 45)).length} urun`} />
          <SummaryRow label="Ortalama stok" value={products.length ? `${Math.round(totals.totalStock / products.length)} adet` : "0 adet"} />
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600">
            AI stok planlayici, kritik urunler icin otomatik tedarik listesi hazirlar.
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div className="section-title">Urun Listesi</div>
          <span className="chip">Canli stok gorunumu</span>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500 mt-4">Urunler yukleniyor...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center text-slate-500 py-12">Urun bulunamadi.</div>
        ) : (
          <div className="mt-4 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="pb-3">Urun</th>
                  <th className="pb-3">Barkod</th>
                  <th className="pb-3">Fiyat</th>
                  <th className="pb-3">Stok</th>
                  <th className="pb-3">SKT</th>
                  <th className="pb-3">Durum</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {filtered.map((product) => {
                  const isLow = product.stock <= 5;
                  const isExpiring =
                    product.expiryDate &&
                    new Date(product.expiryDate) <
                      new Date(Date.now() + 1000 * 60 * 60 * 24 * 45);
                  return (
                    <tr key={product.id} className="border-t border-slate-100">
                      <td className="py-3 font-semibold text-slate-900">
                        {product.name}
                      </td>
                      <td>{product.barcode}</td>
                      <td>{formatPrice(product.price)}</td>
                      <td>
                        <span
                          className={`pill ${
                            isLow
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td>
                        {product.expiryDate
                          ? new Date(product.expiryDate).toLocaleDateString("tr-TR")
                          : "-"}
                      </td>
                      <td>
                        {isLow && <span className="pill bg-rose-100 text-rose-700">Kritik</span>}
                        {!isLow && isExpiring && (
                          <span className="pill bg-amber-100 text-amber-700">SKT yakin</span>
                        )}
                        {!isLow && !isExpiring && (
                          <span className="pill bg-emerald-100 text-emerald-700">Normal</span>
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

function SummaryRow({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between text-sm text-slate-600">
      <span>{label}</span>
      <span className={`font-semibold ${accent || "text-slate-900"}`}>{value}</span>
    </div>
  );
}
