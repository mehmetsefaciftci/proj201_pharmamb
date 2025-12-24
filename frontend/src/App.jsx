import React, { useState } from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import Orders from "./pages/Orders";
import Prescriptions from "./pages/Prescriptions";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import { clearSession, getStoredUser } from "./services/api";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [session, setSession] = useState(() => getStoredUser());

  if (!session) {
    return <Login onLogin={(user) => setSession(user)} />;
  }

  function handleLogout() {
    clearSession();
    setSession(null);
  }

  return (
    <Layout
      page={page}
      setPage={setPage}
      user={session}
      onLogout={handleLogout}
    >
      {page === "dashboard" && <Dashboard />}
      {page === "products" && <Products />}
      {page === "sales" && <Sales />}
      {page === "orders" && <Orders />}
      {page === "prescriptions" && <Prescriptions />}
      {page === "reports" && <Reports />}
    </Layout>
  );
}
