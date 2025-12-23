import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [productsRes, salesRes] = await Promise.all([
        api.get("/products"),
        api.get("/sales"),
      ]);

      const products = productsRes.data;
      const sales = salesRes.data;

      const totalProducts = products.length;
      const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
      const lowStockCount = products.filter((p) => p.stock < 5).length;

      const today = new Date().toDateString();
      const todaySales = sales.filter(
        (s) => new Date(s.saleDate).toDateString() === today
      );

      const todaySaleCount = todaySales.length;
      const todayQuantity = todaySales.reduce(
        (sum, s) => sum + s.quantity,
        0
      );

      setStats({
        totalProducts,
        totalStock,
        lowStockCount,
        todaySaleCount,
        todayQuantity,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) return <p>Loading dashboard...</p>;
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card title="Total Products" value={stats.totalProducts} />
      <Card title="Total Stock" value={stats.totalStock} />
      <Card
        title="Low Stock Items"
        value={stats.lowStockCount}
        danger
      />
      <Card title="Today's Sales" value={stats.todaySaleCount} />
      <Card title="Items Sold Today" value={stats.todayQuantity} />
    </div>
  );
}

function Card({ title, value, danger }) {
  return (
    <div
      className={`bg-white rounded-xl shadow p-6 ${
        danger ? "border-l-4 border-red-500" : ""
      }`}
    >
      <div className="text-sm text-gray-500">{title}</div>
      <div
        className={`text-3xl font-bold mt-2 ${
          danger ? "text-red-600" : "text-slate-900"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
