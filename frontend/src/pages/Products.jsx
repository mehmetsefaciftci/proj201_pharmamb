import React, { useEffect, useState, useCallback } from "react";
import api from "../services/api";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    barcode: "",
    price: "",
    stock: "",
    expiryDate: "",
  });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (error) {
      console.error(error);
      alert("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  async function addProduct(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/products", {
        name: form.name,
        barcode: form.barcode,
        price: Number(form.price),
        stock: Number(form.stock),
        expiryDate: form.expiryDate
          ? new Date(form.expiryDate).toISOString()
          : null,
      });

      setForm({
        name: "",
        barcode: "",
        price: "",
        stock: "",
        expiryDate: "",
      });

      await loadProducts();
    } catch (error) {
      console.error(error);
      alert("Failed to add product");
    } finally {
      setSubmitting(false);
    }
  }

  function formatPrice(value) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(value);
  }

  function isExpiringSoon(date) {
    if (!date) return false;
    const diff =
      new Date(date).getTime() - new Date().getTime();
    return diff < 1000 * 60 * 60 * 24 * 30; // 30 days
  }

  return (
    <div className="space-y-8">
      {/* Add Product */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Add Product</h2>

        <form
          onSubmit={addProduct}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4"
        >
          <input
            className="border rounded px-3 py-2"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <input
            className="border rounded px-3 py-2"
            placeholder="Barcode"
            value={form.barcode}
            onChange={(e) =>
              setForm({ ...form, barcode: e.target.value })
            }
            required
          />

          <input
            className="border rounded px-3 py-2"
            type="number"
            step="0.01"
            placeholder="Price"
            value={form.price}
            onChange={(e) =>
              setForm({ ...form, price: e.target.value })
            }
            required
          />

          <input
            className="border rounded px-3 py-2"
            type="number"
            min="0"
            placeholder="Stock"
            value={form.stock}
            onChange={(e) =>
              setForm({ ...form, stock: e.target.value })
            }
            required
          />

          <input
            className="border rounded px-3 py-2"
            type="date"
            value={form.expiryDate}
            onChange={(e) =>
              setForm({ ...form, expiryDate: e.target.value })
            }
          />

          <button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 text-white rounded px-4 py-2 hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add"}
          </button>
        </form>
      </div>

      {/* Products List */}
      {loading ? (
        <p className="text-center text-gray-500">Loading products...</p>
      ) : products.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white rounded-xl shadow">
          No products added yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl shadow p-5 hover:shadow-xl transition relative"
            >
              {isExpiringSoon(p.expiryDate) && (
                <span className="absolute top-3 right-3 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                  Expiring Soon
                </span>
              )}

              <div className="text-lg font-bold">{p.name}</div>
              <div className="text-sm text-gray-500 mb-2">
                Barcode: {p.barcode}
              </div>

              <div className="flex justify-between mt-2">
                <span>Price</span>
                <span className="font-semibold">
                  {formatPrice(p.price)}
                </span>
              </div>

              <div className="flex justify-between mt-2">
                <span>Stock</span>
                <span
                  className={`font-semibold ${
                    p.stock < 5
                      ? "text-red-500"
                      : "text-green-600"
                  }`}
                >
                  {p.stock}
                </span>
              </div>

              <div className="mt-3 text-sm text-gray-500">
                Expiry:{" "}
                {p.expiryDate
                  ? new Date(p.expiryDate).toLocaleDateString()
                  : "-"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
