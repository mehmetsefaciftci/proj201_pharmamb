import React from "react";

const mockPrescriptions = [
  {
    id: "RX-2041",
    patient: "Ayse Demir",
    doctor: "Dr. Selim Atas",
    status: "Onay Bekliyor",
    updatedAt: "2025-07-08T10:20:00",
  },
  {
    id: "RX-2040",
    patient: "Mehmet Sari",
    doctor: "Dr. Elif Koksal",
    status: "Hazirlaniyor",
    updatedAt: "2025-07-08T09:10:00",
  },
  {
    id: "RX-2039",
    patient: "Yasemin Kaya",
    doctor: "Dr. Burak Er",
    status: "Teslim Edildi",
    updatedAt: "2025-07-07T18:40:00",
  },
];

const statusStyles = {
  "Onay Bekliyor": "bg-amber-100 text-amber-700",
  Hazirlaniyor: "bg-sky-100 text-sky-700",
  "Teslim Edildi": "bg-emerald-100 text-emerald-700",
};

export default function Prescriptions() {
  return (
    <div className="space-y-6">
      <section className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
        <div className="glass-panel rounded-3xl p-6">
          <div className="section-title">E-Recete Merkezi</div>
          <p className="text-sm text-slate-500 mt-2">
            Medula ve e-Nabiz dogrulama adimlarini tek is akisi uzerinden yonetin.
          </p>
          <div className="mt-5 grid sm:grid-cols-3 gap-3 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Onay bekleyen</div>
              <div className="text-xl font-semibold text-slate-900 mt-2">2</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Hazirlanan</div>
              <div className="text-xl font-semibold text-slate-900 mt-2">1</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Teslim</div>
              <div className="text-xl font-semibold text-slate-900 mt-2">8</div>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="section-title">Uyum ve Denetim</div>
          <div className="text-sm text-slate-600">
            E-recete adimlari loglanir, yetkilendirme ve dogrulama surecleri otomatik kaydedilir.
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600">
            Son audit: 3 gun once • Durum: Uyumlu
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div className="section-title">Aktif Receteler</div>
          <span className="chip">Canli kontrol</span>
        </div>
        <div className="mt-4 space-y-3">
          {mockPrescriptions.map((item) => (
            <div key={item.id} className="rounded-2xl bg-white/70 p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-900">{item.patient}</div>
                  <div className="text-xs text-slate-500">
                    {item.id} • {item.doctor}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className={`pill ${statusStyles[item.status] || "bg-slate-100 text-slate-700"}`}>
                    {item.status}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(item.updatedAt).toLocaleString("tr-TR")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
