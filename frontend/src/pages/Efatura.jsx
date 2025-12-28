import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";

export default function Efatura() {
  const [efaturas, setEfaturas] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saleId, setSaleId] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const [efaturaRes, salesRes] = await Promise.all([
        api.get("/efatura"),
        api.get("/sales"),
      ]);
      setEfaturas(efaturaRes.data);
      setSales(salesRes.data);
    } catch (error) {
      console.error(error);
      alert("E-fatura verisi yuklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const salesWithoutEfatura = useMemo(() => {
    const efaturaSales = new Set(efaturas.map((inv) => inv.saleId));
    return sales.filter((sale) => sale.status === "COMPLETED" && !efaturaSales.has(sale.id));
  }, [efaturas, sales]);

  async function createEfatura(e) {
    e.preventDefault();
    if (!saleId) return;
    setCreating(true);
    try {
      await api.post("/efatura", { saleId: Number(saleId) });
      setSaleId("");
      await loadData();
    } catch (error) {
      console.error(error);
      alert("E-fatura olusturulamadi");
    } finally {
      setCreating(false);
    }
  }

  async function previewEfatura(efaturaId) {
    try {
      const res = await api.get(`/efatura/${efaturaId}/pdf`, {
        responseType: "blob",
      });
      const blobUrl = URL.createObjectURL(res.data);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      alert("PDF onizleme basarisiz");
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl p-6">
        <div className="section-title">E-Fatura</div>
        <p className="text-sm text-slate-500 mt-2">
          Tamamlanan satislar icin e-fatura olusturun.
        </p>
        <form onSubmit={createEfatura} className="mt-4 grid md:grid-cols-[1fr_auto] gap-3">
          <select
            className="border border-slate-200 rounded-2xl px-3 py-2"
            value={saleId}
            onChange={(e) => setSaleId(e.target.value)}
          >
            <option value="">Satis sec</option>
            {salesWithoutEfatura.map((sale) => (
              <option key={sale.id} value={sale.id}>
                #{sale.id} - {formatPrice(Number(sale.total || 0))}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={creating}
            className="rounded-2xl bg-indigo-600 text-white px-4 py-2 font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {creating ? "Olusturuluyor..." : "E-fatura olustur"}
          </button>
        </form>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div className="section-title">E-Fatura Listesi</div>
          <span className="chip">E-fatura durumu</span>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500 mt-4">E-faturalar yukleniyor...</p>
        ) : efaturas.length === 0 ? (
          <p className="text-sm text-slate-500 mt-4">Henuz e-fatura yok.</p>
        ) : (
          <div className="mt-4 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="pb-3">Fatura No</th>
                  <th className="pb-3">Satis</th>
                  <th className="pb-3">Tarih</th>
                  <th className="pb-3">Durum</th>
                  <th className="pb-3">PDF</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {efaturas.map((efatura) => (
                  <tr key={efatura.id} className="border-t border-slate-100">
                    <td className="py-3 font-semibold text-slate-900">{efatura.invoiceNo}</td>
                    <td>#{efatura.saleId}</td>
                    <td>{new Date(efatura.createdAt).toLocaleString("tr-TR")}</td>
                    <td>
                      {efatura.status === "ERROR"
                        ? "Hata"
                        : efatura.status === "DRAFT"
                          ? "Taslak"
                          : "Gonderildi"}
                    </td>
                    <td>
                      {efatura.pdfUrl ? (
                        <button
                          type="button"
                          onClick={() => previewEfatura(efatura.id)}
                          className="text-xs px-2 py-1 rounded-xl bg-slate-100 text-slate-700"
                        >
                          Onizle
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Hazir degil</span>
                      )}
                    </td>
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
