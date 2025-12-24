import React, { useState } from "react";
import api, { storeSession } from "../services/api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });
      storeSession(res.data);
      onLogin(res.data.user);
    } catch (err) {
      console.error(err);
      setError("Giris basarisiz. Bilgileri kontrol edin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="glass-panel rounded-[32px] w-full max-w-5xl overflow-hidden">
        <div className="grid md:grid-cols-[1.1fr_1fr]">
          <div className="p-8 md:p-10 bg-white/70">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold">
                PM
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">PharmaMB</h1>
                <p className="text-sm text-slate-500">Akilli eczane otomasyonu</p>
              </div>
            </div>

            <div className="mt-8 space-y-5">
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Guvenli giris
                </div>
                <h2 className="text-3xl font-semibold text-slate-900 mt-2">
                  Eczanenizi tek panelden yonetin
                </h2>
                <p className="text-sm text-slate-500 mt-3">
                  Stok, satis, recete ve siparisler anlik senkron. PharmaMB ile her cihazdan
                  kontrol sizde.
                </p>
              </div>

              <div className="grid gap-3">
                {[
                  "Bulut yedekleme ve veri guvenligi",
                  "AI destekli stok ve talep ongorusu",
                  "Medula ve e-Nabiz entegrasyon hedefi",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Demo admin
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  <div>
                    E-posta:{" "}
                    <span className="font-semibold text-slate-900">admin@pharmamb.local</span>
                  </div>
                  <div>
                    Sifre:{" "}
                    <span className="font-semibold text-slate-900">Admin123!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <div className="text-sm text-slate-500">
              Hos geldiniz. Devam etmek icin giris yapin.
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">E-posta</label>
                <input
                  type="email"
                  placeholder="ornek@eczane.com"
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white/80 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Sifre</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white/80 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <div className="text-sm text-rose-600">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 text-white py-3 rounded-2xl font-semibold hover:bg-teal-700 transition disabled:opacity-60"
              >
                {loading ? "Giris yapiliyor..." : "Giris yap"}
              </button>
            </form>

            <div className="soft-divider my-6" />
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="chip">2FA hazir</span>
              <span className="chip">ISO 27001 hedefi</span>
              <span className="chip">99.9% erisim</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
