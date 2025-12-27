import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";

export default function Invoices() {
  const apiBase = api.defaults.baseURL || "";
  const [invoices, setInvoices] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saleId, setSaleId] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const [invoiceRes, salesRes] = await Promise.all([
        api.get("/invoices"),
        api.get("/sales"),
      ]);
      setInvoices(invoiceRes.data);
      setSales(salesRes.data);
    } catch (error) {
      console.error(error);
      alert("Fatura verisi yuklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const salesWithoutInvoice = useMemo(() => {
    const invoicedSales = new Set(invoices.map((inv) => inv.saleId));
    return sales.filter(
      (sale) => sale.status === "COMPLETED" && !invoicedSales.has(sale.id)
    );
  }, [invoices, sales]);

  async function createInvoice(e) {
    e.preventDefault();
    if (!saleId) return;
    setCreating(true);
    try {
      await api.post("/invoices", { saleId: Number(saleId) });
      setSaleId("");
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Fatura olusturulamadi");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl p-6">
        <div className="section-title">E-Arsiv Fatura</div>
        <p className="text-sm text-slate-500 mt-2">
          Tamamlanan satislar icin temel e-arsiv faturasi olusturun.
        </p>
        <form onSubmit={createInvoice} className="mt-4 grid md:grid-cols-[1fr_auto] gap-3">
          <select
            className="border border-slate-200 rounded-2xl px-3 py-2"
            value={saleId}
            onChange={(e) => setSaleId(e.target.value)}
          >
            <option value="">Satis sec</option>
            {salesWithoutInvoice.map((sale) => (
              <option key={sale.id} value={sale.id}>
                #{sale.id} - {formatPrice(Number(sale.total || 0))}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={creating}
            className="rounded-2xl bg-teal-600 text-white px-4 py-2 font-semibold hover:bg-teal-700 transition disabled:opacity-50"
          >
            {creating ? "Olusturuluyor..." : "Fatura olustur"}
          </button>
        </form>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div className="section-title">Fatura Listesi</div>
          <span className="chip">E-arsiv durumu</span>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500 mt-4">Faturalar yukleniyor...</p>
        ) : invoices.length === 0 ? (
          <p className="text-sm text-slate-500 mt-4">Henuz fatura yok.</p>
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
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t border-slate-100">
                    <td className="py-3 font-semibold text-slate-900">{invoice.invoiceNo}</td>
                    <td>#{invoice.saleId}</td>
                    <td>{new Date(invoice.createdAt).toLocaleString("tr-TR")}</td>
                    <td>{invoice.status === "ERROR" ? "Hata" : "Gonderildi"}</td>
                    <td>
                      {invoice.pdfUrl ? (
                        <a
                          href={`${apiBase}${invoice.pdfUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs px-2 py-1 rounded-xl bg-slate-100 text-slate-700"
                        >
                          Onizle
                        </a>
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
