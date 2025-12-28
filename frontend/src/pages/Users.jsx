import React, { useEffect, useState } from "react";
import api, { getStoredUser } from "../services/api";

export default function Users() {
  const [currentUser] = useState(() => getStoredUser());
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF",
  });

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (error) {
      console.error(error);
      alert("Kullanicilar yuklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function addUser(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/users", form);
      setForm({ name: "", email: "", password: "", role: "STAFF" });
      await loadUsers();
    } catch (error) {
      console.error(error);
      alert("Kullanici eklenemedi");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateUser(userId, payload) {
    try {
      await api.patch(`/users/${userId}`, payload);
      await loadUsers();
    } catch (error) {
      console.error(error);
      alert("Kullanici guncellenemedi");
    }
  }

  async function deleteUser(userId) {
    if (!window.confirm("Kullanici silinsin mi?")) return;
    try {
      await api.delete(`/users/${userId}`);
      await loadUsers();
    } catch (error) {
      console.error(error);
      alert("Kullanici silinemedi");
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl p-6">
        <div className="section-title">Kullanici Ekle</div>
        <form onSubmit={addUser} className="mt-4 grid md:grid-cols-4 gap-3">
          <input
            className="border border-slate-200 rounded-2xl px-3 py-2"
            placeholder="Ad soyad"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="border border-slate-200 rounded-2xl px-3 py-2"
            placeholder="E-posta"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            className="border border-slate-200 rounded-2xl px-3 py-2"
            placeholder="Sifre"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <select
            className="border border-slate-200 rounded-2xl px-3 py-2"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="STAFF">Personel</option>
            <option value="PHARMACIST">Eczaci</option>
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="md:col-span-4 rounded-2xl bg-teal-600 text-white px-4 py-2 font-semibold hover:bg-teal-700 transition disabled:opacity-50"
          >
            {submitting ? "Ekleniyor..." : "Kullanici ekle"}
          </button>
        </form>
      </section>

      <section className="glass-panel rounded-3xl p-6">
        <div className="section-title">Kullanici Listesi</div>
        {loading ? (
          <p className="text-sm text-slate-500 mt-4">Kullanicilar yukleniyor...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-slate-500 mt-4">Kullanici bulunamadi.</p>
        ) : (
          <div className="mt-4 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="pb-3">Ad</th>
                  <th className="pb-3">E-posta</th>
                  <th className="pb-3">Rol</th>
                  <th className="pb-3">Durum</th>
                  <th className="pb-3">Islem</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100">
                    <td className="py-3 font-semibold text-slate-900">{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        className="border border-slate-200 rounded-xl px-2 py-1 text-xs"
                        value={user.role}
                        onChange={(e) => updateUser(user.id, { role: e.target.value })}
                      >
                        <option value="STAFF">Personel</option>
                        <option value="PHARMACIST">Eczaci</option>
                      </select>
                    </td>
                    <td>
                      <button
                        onClick={() => updateUser(user.id, { isActive: !user.isActive })}
                        className={`text-xs px-2 py-1 rounded-xl ${
                          user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {user.isActive ? "Aktif" : "Pasif"}
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => deleteUser(user.id)}
                        disabled={currentUser?.id === user.id}
                        className="text-xs px-2 py-1 rounded-xl bg-slate-200 text-slate-700 disabled:opacity-50"
                      >
                        Sil
                      </button>
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
