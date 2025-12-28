import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function Medula() {
  const [form, setForm] = useState({ patientTc: "", prescriptionNo: "" });
  const [prescriptions, setPrescriptions] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  async function loadPrescriptions() {
    setLoadingList(true);
    try {
      const res = await api.get("/prescriptions");
      setPrescriptions(res.data);
    } catch (error) {
      console.error(error);
      alert("Recete listesi yuklenemedi");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadPrescriptions();
  }, []);

  async function handleLookup(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post("/prescriptions/lookup", {
        patientTc: form.patientTc,
        prescriptionNo: form.prescriptionNo,
      });
      setResult(res.data);
      localStorage.setItem("pharmamb_active_prescription", JSON.stringify(res.data));
      await loadPrescriptions();
      setForm({ patientTc: "", prescriptionNo: "" });
    } catch (error) {
      console.error(error);
      alert("Recete sorgulama basarisiz");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl p-6">
        <div className="section-title">Medula Recete Girisi</div>
        <p className="text-sm text-slate-500 mt-2">
          TC kimlik ve recete no ile sorgulama yapin. Bu ekran recete ile satisi
          baglamak icin kullanilir.
        </p>
        <form onSubmit={handleLookup} className="mt-4 grid md:grid-cols-[1fr_1fr_auto] gap-3">
          <input
            className="border border-slate-200 rounded-2xl px-3 py-2"
            placeholder="TC kimlik no"
            value={form.patientTc}
            onChange={(e) => setForm({ ...form, patientTc: e.target.value })}
            required
          />
          <input
            className="border border-slate-200 rounded-2xl px-3 py-2"
            placeholder="Recete no"
            value={form.prescriptionNo}
            onChange={(e) => setForm({ ...form, prescriptionNo: e.target.value })}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-teal-600 text-white px-4 py-2 font-semibold hover:bg-teal-700 transition disabled:opacity-50"
          >
            {loading ? "Sorgulaniyor..." : "Sorgula"}
          </button>
        </form>
        {result && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            Recete kaydi hazir: {result.patientTc} / {result.prescriptionNo} (ID:{" "}
            {result.id})
          </div>
        )}
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div className="section-title">Recete Listesi</div>
          <span className="chip">Son kayitlar</span>
        </div>
        {loadingList ? (
          <p className="text-sm text-slate-500 mt-4">Receteler yukleniyor...</p>
        ) : prescriptions.length === 0 ? (
          <p className="text-sm text-slate-500 mt-4">Henuz recete yok.</p>
        ) : (
          <div className="mt-4 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="pb-3">TC Kimlik</th>
                  <th className="pb-3">Recete No</th>
                  <th className="pb-3">Durum</th>
                  <th className="pb-3">Tarih</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {prescriptions.map((prescription) => (
                  <tr key={prescription.id} className="border-t border-slate-100">
                    <td className="py-3 font-semibold text-slate-900">
                      {prescription.patientTc}
                    </td>
                    <td>{prescription.prescriptionNo}</td>
                    <td>{prescription.status === "VERIFIED" ? "Onayli" : "Beklemede"}</td>
                    <td>{new Date(prescription.createdAt).toLocaleString("tr-TR")}</td>
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
