import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    productId: "",
    quantity: 1,
  });

  async function loadData() {
    setLoading(true);
    try {
      const [productsRes, salesRes] = await Promise.all([
        api.get("/products"),
        api.get("/sales"),
      ]);

      setProducts(productsRes.data);
      setSales(salesRes.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load sales data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createSale(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/sales", {
        productId: Number(form.productId),
        quantity: Number(form.quantity),
      });

      setForm({ productId: "", quantity: 1 });
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Sale failed (check stock)");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* New Sale */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">New Sale</h2>

        <form
          onSubmit={createSale}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <select
            className="border rounded px-3 py-2"
            value={form.productId}
            onChange={(e) =>
              setForm({ ...form, productId: e.target.value })
            }
            required
          >
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.stock} left)
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            className="border rounded px-3 py-2"
            placeholder="Quantity"
            value={form.quantity}
            onChange={(e) =>
              setForm({ ...form, quantity: e.target.value })
            }
            required
          />

          <button
            type="submit"
            disabled={submitting}
            className="bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700 transition disabled:opacity-50"
          >
            {submitting ? "Processing..." : "Sell"}
          </button>
        </form>
      </div>

      {/* Sales History */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Sales History</h2>

        {loading ? (
          <p className="text-gray-500">Loading sales...</p>
        ) : sales.length === 0 ? (
          <p className="text-gray-500">No sales yet</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left text-gray-600">
                <th className="py-2">Product</th>
                <th>Quantity</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="py-2">{s.product.name}</td>
                  <td>{s.quantity}</td>
                  <td>
                    {new Date(s.saleDate).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
