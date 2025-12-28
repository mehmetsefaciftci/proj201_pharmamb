import React, { useEffect, useMemo, useState } from "react";
import api, { getStoredUser } from "../services/api";

export default function Sales() {
  const [user] = useState(() => getStoredUser());
  const isPharmacist = user?.role === "PHARMACIST";
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [heldSales, setHeldSales] = useState([]);
  const [activePrescription, setActivePrescription] = useState(null);
  const [dailyRevenue, setDailyRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [holding, setHolding] = useState(false);
  const [revenuePassword, setRevenuePassword] = useState("");
  const [revenueUnlocked, setRevenueUnlocked] = useState(false);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenueError, setRevenueError] = useState("");
  const [holdPaymentTypes, setHoldPaymentTypes] = useState({});

  const [form, setForm] = useState({
    barcode: "",
    productId: "",
    quantity: 1,
    paymentType: "CASH",
    holdNote: "",
  });

  async function loadData() {
    setLoading(true);
    try {
      const [productsRes, salesRes, heldRes] = await Promise.all([
        api.get("/products"),
        api.get("/sales"),
        api.get("/sales/hold"),
      ]);

      setProducts(productsRes.data);
      setSales(salesRes.data);
      setHeldSales(heldRes.data || []);
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

  useEffect(() => {
    const raw = localStorage.getItem("pharmamb_active_prescription");
    if (!raw) {
      setActivePrescription(null);
      return;
    }
    try {
      setActivePrescription(JSON.parse(raw));
    } catch {
      setActivePrescription(null);
    }
  }, []);

  useEffect(() => {
    const code = form.barcode.trim();
    if (!code) {
      setForm((prev) => (prev.productId ? { ...prev, productId: "" } : prev));
      return;
    }

    const matched = products.find(
      (product) => product.barcode === code || product.qrCode === code
    );

    if (matched && String(matched.id) !== String(form.productId)) {
      setForm((prev) => ({ ...prev, productId: String(matched.id) }));
    }
  }, [form.barcode, form.productId, products]);

  async function createSale(e) {
    e.preventDefault();
    const selectedProduct = form.barcode
      ? products.find(
          (product) =>
            product.barcode === form.barcode || product.qrCode === form.barcode
        )
      : products.find((product) => String(product.id) === String(form.productId));

    if (selectedProduct?.productType === "ANTIBIOTIC" && !activePrescription) {
      alert("Recetesiz antibiyotik satilamaz");
      return;
    }

    setSubmitting(true);

    try {
      const item = form.barcode
        ? { barcode: form.barcode, quantity: Number(form.quantity) }
        : { productId: Number(form.productId), quantity: Number(form.quantity) };

      await api.post("/sales", {
        items: [item],
        paymentType: form.paymentType,
        prescriptionId: activePrescription?.id || null,
      });

      setForm({
        barcode: "",
        productId: "",
        quantity: 1,
        paymentType: "CASH",
        holdNote: "",
      });
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Satis basarisiz (stok kontrol edin)");
    } finally {
      setSubmitting(false);
    }
  }

  async function holdSale() {
    const selectedProduct = form.barcode
      ? products.find(
          (product) =>
            product.barcode === form.barcode || product.qrCode === form.barcode
        )
      : products.find((product) => String(product.id) === String(form.productId));

    if (selectedProduct?.productType === "ANTIBIOTIC" && !activePrescription) {
      alert("Recetesiz antibiyotik satilamaz");
      return;
    }

    setHolding(true);

    try {
      const item = form.barcode
        ? { barcode: form.barcode, quantity: Number(form.quantity) }
        : { productId: Number(form.productId), quantity: Number(form.quantity) };

      await api.post("/sales/hold", {
        items: [item],
        prescriptionId: activePrescription?.id || null,
        note: form.holdNote || "",
      });

      setForm({
        barcode: "",
        productId: "",
        quantity: 1,
        paymentType: "CASH",
        holdNote: "",
      });
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Bekleyen satis kaydedilemedi");
    } finally {
      setHolding(false);
    }
  }

  async function completeHeldSale(holdId) {
    const paymentType = holdPaymentTypes[holdId] || "CASH";
    try {
      await api.post(`/sales/hold/${holdId}/complete`, { paymentType });
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Bekleyen satis tamamlanamadi");
    }
  }

  async function deleteHeldSale(holdId) {
    if (!window.confirm("Bekleyen satis silinsin mi?")) return;
    try {
      await api.delete(`/sales/hold/${holdId}`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Bekleyen satis silinemedi");
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

  async function deleteSale(saleId) {
    if (!window.confirm("Satis kaydi silinsin mi?")) return;
    try {
      await api.delete(`/sales/${saleId}`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Satis silinemedi");
    }
  }

  async function unlockDailyRevenue(e) {
    e.preventDefault();
    setRevenueLoading(true);
    setRevenueError("");

    try {
      const res = await api.post("/sales/daily-summary/secure", {
        password: revenuePassword,
      });
      setDailyRevenue(res.data.totalRevenue || 0);
      setRevenueUnlocked(true);
      setRevenuePassword("");
    } catch (err) {
      console.error(err);
      setRevenueError("Parola hatali");
      setRevenueUnlocked(false);
    } finally {
      setRevenueLoading(false);
    }
  }

  const selectedProduct = useMemo(() => {
    if (form.barcode) {
      return products.find(
        (product) => product.barcode === form.barcode || product.qrCode === form.barcode
      );
    }
    if (form.productId) {
      return products.find((product) => String(product.id) === String(form.productId));
    }
    return null;
  }, [form.barcode, form.productId, products]);

  const expiringWarning = useMemo(() => {
    if (!selectedProduct?.expiryDate) return null;
    const selectedExpiry = new Date(selectedProduct.expiryDate).getTime();
    if (Number.isNaN(selectedExpiry)) return null;

    return products.find((product) => {
      if (product.id === selectedProduct.id) return false;
      if (!product.expiryDate || product.stock <= 0) return false;
      if (product.name !== selectedProduct.name) return false;
      const productExpiry = new Date(product.expiryDate).getTime();
      return productExpiry < selectedExpiry;
    });
  }, [products, selectedProduct]);

  const requiresPrescription = selectedProduct?.productType === "ANTIBIOTIC";

  const totals = useMemo(() => {
    const completedSales = sales.filter((sale) => sale.status === "COMPLETED");
    const todayLabel = new Date().toDateString();
    const todayCompleted = completedSales.filter(
      (sale) => new Date(sale.createdAt).toDateString() === todayLabel
    );
    const revenue = completedSales.reduce((sum, sale) => sum + Number(sale.total), 0);
    return {
      revenue,
      todaySales: todayCompleted.length,
      completedCount: completedSales.length,
    };
  }, [sales]);

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
          value={
            totals.completedCount
              ? formatPrice(totals.revenue / totals.completedCount)
              : formatPrice(0)
          }
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
              placeholder="Barkod / Karekod"
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            />

            <select
              className="border border-slate-200 rounded-2xl px-3 py-2"
              value={form.productId}
              onChange={(e) => {
                const nextId = e.target.value;
                const selected = products.find(
                  (product) => String(product.id) === String(nextId)
                );
                setForm({
                  ...form,
                  productId: nextId,
                  barcode: selected?.barcode || "",
                });
              }}
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

            <input
              className="md:col-span-4 border border-slate-200 rounded-2xl px-3 py-2"
              placeholder="Emanet notu (opsiyonel)"
              value={form.holdNote}
              onChange={(e) => setForm({ ...form, holdNote: e.target.value })}
            />

            <div className="md:col-span-4 grid md:grid-cols-2 gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-emerald-600 text-white px-4 py-2 font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {submitting ? "Isleniyor..." : "Satis yap"}
              </button>
              <button
                type="button"
                disabled={holding}
                onClick={holdSale}
                className="rounded-2xl bg-slate-900 text-white px-4 py-2 font-semibold hover:bg-slate-800 transition disabled:opacity-50"
              >
                {holding ? "Beklemeye aliniyor..." : "Beklemeye al"}
              </button>
            </div>
          </form>
          {activePrescription && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="chip">
                Aktif recete: {activePrescription.patientTc} /{" "}
                {activePrescription.prescriptionNo}
              </span>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("pharmamb_active_prescription");
                  setActivePrescription(null);
                }}
                className="text-xs text-slate-500 underline"
              >
                Temizle
              </button>
            </div>
          )}
          {(requiresPrescription || expiringWarning) && (
            <div className="mt-4 space-y-2 text-xs">
              {requiresPrescription && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-700">
                  Recetesiz antibiyotik satisina izin verilmez. Medula ekranindan recete olusturun.
                </div>
              )}
              {expiringWarning && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
                  Daha yakin miadli urun bulundu: {expiringWarning.name} (
                  {new Date(expiringWarning.expiryDate).toLocaleDateString("tr-TR")})
                </div>
              )}
            </div>
          )}
        </div>

        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="section-title">Gunluk Ozet</div>
          <SummaryRow label="Gunluk islem" value={`${totals.todaySales} adet`} />
          <SummaryRow
            label="Gunun cirosu"
            value={revenueUnlocked ? formatPrice(dailyRevenue) : "Parola gerekli"}
            accent="text-emerald-600"
          />
          <SummaryRow label="Kasa durumu" value="Canli izleme" />
          {isPharmacist ? (
            <form onSubmit={unlockDailyRevenue} className="space-y-2">
              <div className="text-xs text-slate-500">Gunluk ciro goruntuleme</div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  className="flex-1 border border-slate-200 rounded-2xl px-3 py-2 text-sm"
                  placeholder="Eczaci sifresi"
                  value={revenuePassword}
                  onChange={(e) => setRevenuePassword(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={revenueLoading}
                  className="rounded-2xl bg-teal-600 text-white px-4 py-2 text-sm font-semibold hover:bg-teal-700 transition disabled:opacity-50"
                >
                  {revenueLoading ? "Kontrol..." : "Ciroyu goster"}
                </button>
              </div>
              {revenueError && <div className="text-xs text-rose-600">{revenueError}</div>}
            </form>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 text-xs text-slate-500">
              Gunluk ciro sadece eczaci tarafindan gorulebilir.
            </div>
          )}
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600">
            Iptal ve iade islemleri bu ekrandan yapilir.
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div className="section-title">Bekleyen Satislar</div>
          <span className="chip">Emanet</span>
        </div>
        {heldSales.length === 0 ? (
          <p className="text-sm text-slate-500 mt-4">Bekleyen satis yok.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {heldSales.map((hold) => (
              <div key={hold.id} className="rounded-2xl border border-slate-100 bg-white/70 p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      #{hold.id} bekleyen satis
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(hold.createdAt).toLocaleString("tr-TR")} •{" "}
                      {hold.createdBy?.name || "Kullanici"}
                    </div>
                    {hold.note && (
                      <div className="text-xs text-slate-500 mt-1">Not: {hold.note}</div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="border border-slate-200 rounded-2xl px-3 py-2 text-xs"
                      value={holdPaymentTypes[hold.id] || "CASH"}
                      onChange={(e) =>
                        setHoldPaymentTypes((prev) => ({
                          ...prev,
                          [hold.id]: e.target.value,
                        }))
                      }
                    >
                      <option value="CASH">Nakit</option>
                      <option value="CARD">Kart</option>
                      <option value="OTHER">Diger</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => completeHeldSale(hold.id)}
                      className="text-xs px-3 py-2 rounded-xl bg-emerald-600 text-white"
                    >
                      Tamamla
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteHeldSale(hold.id)}
                      className="text-xs px-3 py-2 rounded-xl bg-slate-200 text-slate-700"
                    >
                      Sil
                    </button>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-600">
                  {hold.items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <span>{item.product?.name || "Urun"}</span>
                      <span>{item.quantity} adet</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
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
                        <div className="flex flex-wrap gap-2">
                          {sale.status === "COMPLETED" ? (
                            <>
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
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">Kapali</span>
                          )}
                          {isPharmacist && (
                            <button
                              onClick={() => deleteSale(sale.id)}
                              className="text-xs px-2 py-1 rounded-xl bg-slate-200 text-slate-700"
                            >
                              Sil
                            </button>
                          )}
                        </div>
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
