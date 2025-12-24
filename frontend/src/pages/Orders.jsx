import React, { useEffect, useState } from "react";
import api from "../services/api";

const statusLabels = {
  DRAFT: "Taslak",
  SENT: "Gonderildi",
  PARTIAL: "Kismi teslim",
  RECEIVED: "Teslim alindi",
  CANCELLED: "Iptal",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState([]);

  const [form, setForm] = useState({
    supplierName: "",
    expectedAt: "",
    total: "",
    itemName: "",
    itemQty: 1,
    itemUnit: "kutu",
    notes: "",
  });

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await api.get("/orders");
      setOrders(res.data);
    } catch (error) {
      console.error(error);
      alert("Siparisler yuklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  function addItem() {
    if (!form.itemName || !form.itemQty) return;
    setItems((prev) => [
      ...prev,
      { name: form.itemName, quantity: Number(form.itemQty), unit: form.itemUnit },
    ]);
    setForm({ ...form, itemName: "", itemQty: 1, itemUnit: "kutu" });
  }

  async function createOrder(e) {
    e.preventDefault();
    if (items.length === 0) {
      alert("En az bir urun ekleyin");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/orders", {
        supplierName: form.supplierName,
        expectedAt: form.expectedAt ? new Date(form.expectedAt).toISOString() : null,
        total: form.total ? Number(form.total) : null,
        items,
        notes: form.notes,
      });

      setForm({
        supplierName: "",
        expectedAt: "",
        total: "",
        itemName: "",
        itemQty: 1,
        itemUnit: "kutu",
        notes: "",
      });
      setItems([]);
      await loadOrders();
    } catch (error) {
      console.error(error);
      alert("Siparis olusturulamadi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className="glass-panel rounded-3xl p-6">
          <div className="section-title">Tedarik Siparisi Olustur</div>
          <p className="text-sm text-slate-500 mt-2">
            Onayli tedarikcilerden gelen urunleri tek seferde listeleyin.
          </p>
          <form onSubmit={createOrder} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="border border-slate-200 rounded-2xl px-3 py-2"
                placeholder="Tedarikci"
                value={form.supplierName}
                onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                required
              />
              <input
                className="border border-slate-200 rounded-2xl px-3 py-2"
                type="date"
                value={form.expectedAt}
                onChange={(e) => setForm({ ...form, expectedAt: e.target.value })}
              />
              <input
                className="border border-slate-200 rounded-2xl px-3 py-2"
                placeholder="Tahmini tutar"
                type="number"
                value={form.total}
                onChange={(e) => setForm({ ...form, total: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_140px_auto] gap-3">
              <input
                className="border border-slate-200 rounded-2xl px-3 py-2"
                placeholder="Urun adi"
                value={form.itemName}
                onChange={(e) => setForm({ ...form, itemName: e.target.value })}
              />
              <input
                className="border border-slate-200 rounded-2xl px-3 py-2"
                type="number"
                min="1"
                placeholder="Adet"
                value={form.itemQty}
                onChange={(e) => setForm({ ...form, itemQty: e.target.value })}
              />
              <input
                className="border border-slate-200 rounded-2xl px-3 py-2"
                placeholder="Birim"
                value={form.itemUnit}
                onChange={(e) => setForm({ ...form, itemUnit: e.target.value })}
              />
              <button
                type="button"
                onClick={addItem}
                className="rounded-2xl bg-slate-900 text-white px-4 py-2 font-semibold hover:bg-slate-800 transition"
              >
                Listeye ekle
              </button>
            </div>

            {items.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <div className="text-sm font-semibold text-slate-800 mb-2">Siparis kalemleri</div>
                <ul className="space-y-2 text-sm text-slate-600">
                  {items.map((item, index) => (
                    <li key={`${item.name}-${index}`} className="flex justify-between">
                      <span>{item.name}</span>
                      <span>
                        {item.quantity} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <textarea
              rows="3"
              className="border border-slate-200 rounded-2xl px-3 py-2 w-full"
              placeholder="Notlar"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />

            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-teal-600 text-white px-5 py-2 font-semibold hover:bg-teal-700 transition disabled:opacity-50"
            >
              {submitting ? "Olusturuluyor..." : "Siparisi olustur"}
            </button>
          </form>
        </div>

        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="section-title">Siparis Ozet</div>
          <SummaryRow label="Bekleyen siparis" value={`${orders.filter((o) => o.status === "DRAFT").length} adet`} />
          <SummaryRow label="Yolda" value={`${orders.filter((o) => o.status === "SENT").length} adet`} />
          <SummaryRow label="Teslim alindi" value={`${orders.filter((o) => o.status === "RECEIVED").length} adet`} />
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600">
            Kritik stok urunleri icin otomatik siparis planlayici aktif.
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div className="section-title">Siparis Takibi</div>
          <span className="chip">Durum panosu</span>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500 mt-4">Siparisler yukleniyor...</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-slate-500 mt-4">Henuz siparis yok.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl bg-white/70 p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900">{order.supplierName}</div>
                    <div className="text-xs text-slate-500">
                      {order.items?.length || 0} kalem
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="pill bg-amber-100 text-amber-700">
                      {statusLabels[order.status] || order.status}
                    </span>
                    <span className="text-slate-500">
                      {order.expectedAt
                        ? new Date(order.expectedAt).toLocaleDateString("tr-TR")
                        : "Tarih yok"}
                    </span>
                  </div>
                </div>
                {order.total && (
                  <div className="text-sm text-slate-600 mt-2">
                    Tahmini tutar: {formatPrice(order.total)}
                  </div>
                )}
              </div>
            ))}
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
