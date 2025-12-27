import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function Cash() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openingCash, setOpeningCash] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await api.get("/cash/status");
      setStatus(res.data.open || null);
    } catch (error) {
      console.error(error);
      alert("Kasa durumu yuklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function openCash(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/cash/open", { openingCash: Number(openingCash) });
      setOpeningCash("");
      await loadStatus();
    } catch (error) {
      console.error(error);
      alert("Kasa acilamadi");
    } finally {
      setSubmitting(false);
    }
  }

  async function closeCash(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/cash/close", { closingCash: Number(closingCash) });
      setClosingCash("");
      await loadStatus();
    } catch (error) {
      console.error(error);
      alert("Kasa kapanmadi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl p-6">
        <div className="section-title">Kasa Durumu</div>
        {loading ? (
          <p className="text-sm text-slate-500 mt-4">Kasa bilgisi yukleniyor...</p>
        ) : status ? (
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div>
              <span className="font-semibold text-slate-900">Acik</span>
            </div>
            <div>Acilis: {formatPrice(Number(status.openingCash || 0))}</div>
            <div>
              Baslangic: {new Date(status.openedAt).toLocaleString("tr-TR")}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 mt-4">Kasa kapali.</p>
        )}
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-3xl p-6">
          <div className="section-title">Kasa Ac</div>
          <form onSubmit={openCash} className="mt-4 space-y-3">
            <input
              type="number"
              min="0"
              step="0.01"
              className="border border-slate-200 rounded-2xl px-3 py-2 w-full"
              placeholder="Acilis tutari"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-emerald-600 text-white px-4 py-2 font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
            >
              Kasa ac
            </button>
          </form>
        </div>

        <div className="glass-panel rounded-3xl p-6">
          <div className="section-title">Kasa Kapat</div>
          <form onSubmit={closeCash} className="mt-4 space-y-3">
            <input
              type="number"
              min="0"
              step="0.01"
              className="border border-slate-200 rounded-2xl px-3 py-2 w-full"
              placeholder="Kapanis tutari"
              value={closingCash}
              onChange={(e) => setClosingCash(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-slate-900 text-white px-4 py-2 font-semibold hover:bg-slate-800 transition disabled:opacity-50"
            >
              Kasa kapat
            </button>
          </form>
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
