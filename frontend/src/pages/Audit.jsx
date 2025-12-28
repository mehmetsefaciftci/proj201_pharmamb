import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";

export default function Audit() {
  const [products, setProducts] = useState([]);
  const [counts, setCounts] = useState({});
  const [scanInput, setScanInput] = useState("");
  const [scanReport, setScanReport] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (error) {
      console.error(error);
      alert("Denetim verisi yuklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const countRows = useMemo(() => {
    return products.map((product) => {
      const raw = counts[product.id];
      const parsed = raw === "" || raw == null ? null : Number(raw);
      const diff = parsed == null || Number.isNaN(parsed) ? null : parsed - product.stock;
      return { product, count: raw, diff };
    });
  }, [products, counts]);

  const countSummary = useMemo(() => {
    const filled = countRows.filter((row) => row.count !== undefined && row.count !== "");
    const mismatched = filled.filter((row) => row.diff !== 0);
    return {
      filled: filled.length,
      mismatched: mismatched.length,
      matched: filled.length - mismatched.length,
    };
  }, [countRows]);

  function buildScanReport() {
    const codes = scanInput
      .split(/[\s,;]+/)
      .map((code) => code.trim())
      .filter(Boolean);

    const scannedSet = new Set(codes);
    const qrMap = new Map();
    products.forEach((product) => {
      if (product.qrCode) {
        qrMap.set(product.qrCode, product);
      }
    });

    const missing = products.filter(
      (product) =>
        product.qrCode &&
        product.stock > 0 &&
        !scannedSet.has(product.qrCode)
    );

    const unknown = codes.filter((code) => !qrMap.has(code));

    setScanReport({
      totalScanned: codes.length,
      missing,
      unknown,
    });
  }

  if (loading) {
    return <div className="text-slate-500">Denetim verileri yukleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl p-6">
        <div className="section-title">Denetim Sayimi</div>
        <p className="text-sm text-slate-500 mt-2">
          Fiziki sayimi girerek sistem stoklari ile farklari kontrol edin.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="chip">Girilen: {countSummary.filled}</span>
          <span className="chip">Uyusmayan: {countSummary.mismatched}</span>
          <span className="chip">Uyusan: {countSummary.matched}</span>
        </div>
        <div className="mt-4 overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="pb-3">Urun</th>
                <th className="pb-3">Sistem Stok</th>
                <th className="pb-3">Fiziki Stok</th>
                <th className="pb-3">Fark</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {countRows.map((row) => (
                <tr key={row.product.id} className="border-t border-slate-100">
                  <td className="py-3 font-semibold text-slate-900">{row.product.name}</td>
                  <td>{row.product.stock}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      className="w-24 border border-slate-200 rounded-xl px-2 py-1 text-sm"
                      value={row.count || ""}
                      onChange={(e) =>
                        setCounts((prev) => ({ ...prev, [row.product.id]: e.target.value }))
                      }
                    />
                  </td>
                  <td>
                    {row.diff == null ? "-" : (
                      <span
                        className={
                          row.diff === 0
                            ? "text-emerald-600"
                            : row.diff > 0
                              ? "text-amber-600"
                              : "text-rose-600"
                        }
                      >
                        {row.diff > 0 ? `+${row.diff}` : row.diff}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <div className="section-title">Karekod Denetim Raporu</div>
        <p className="text-sm text-slate-500 mt-2">
          Elinizdeki karekodlari okutun, sistemde olup sayimda olmayanlari listeleyin.
        </p>
        <div className="mt-4 grid lg:grid-cols-[1.2fr_auto] gap-3">
          <textarea
            rows="5"
            className="border border-slate-200 rounded-2xl px-3 py-2 text-sm"
            placeholder="Karekodlari satir satir yapistirin"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
          />
          <button
            type="button"
            onClick={buildScanReport}
            className="rounded-2xl bg-teal-600 text-white px-4 py-2 font-semibold hover:bg-teal-700 transition"
          >
            Raporu olustur
          </button>
        </div>

        {scanReport && (
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="chip">Okutulan: {scanReport.totalScanned}</span>
              <span className="chip">Eksik: {scanReport.missing.length}</span>
              <span className="chip">Bilinmeyen: {scanReport.unknown.length}</span>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Sistemde var, sayimda yok
              </div>
              {scanReport.missing.length === 0 ? (
                <p className="text-sm text-slate-500 mt-2">Eksik karekod yok.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {scanReport.missing.map((product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <span>{product.name}</span>
                      <span className="text-xs text-slate-500">{product.qrCode}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Sayimda var, sistemde yok
              </div>
              {scanReport.unknown.length === 0 ? (
                <p className="text-sm text-slate-500 mt-2">Bilinmeyen karekod yok.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {scanReport.unknown.map((code) => (
                    <div key={code} className="flex items-center justify-between">
                      <span>Bilinmeyen</span>
                      <span className="text-xs text-slate-500">{code}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
