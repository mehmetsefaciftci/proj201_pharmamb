import React, { useState } from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Stock from "./pages/Stock";
import Sales from "./pages/Sales";
import Cash from "./pages/Cash";
import Invoices from "./pages/Invoices";
import Efatura from "./pages/Efatura";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Medula from "./pages/Medula";
import Audit from "./pages/Audit";
import Login from "./pages/Login";
import { clearSession, getStoredUser } from "./services/api";

export default function App() {
  const [session, setSession] = useState(() => getStoredUser());
  const initialPage = session?.role === "STAFF" ? "sales" : "dashboard";
  const [page, setPage] = useState(initialPage);

  if (!session) {
    return (
      <Login
        onLogin={(user) => {
          setSession(user);
          setPage(user?.role === "STAFF" ? "sales" : "dashboard");
        }}
      />
    );
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
      {page === "stock" && <Stock />}
      {page === "sales" && <Sales />}
      {page === "cash" && <Cash />}
      {page === "invoices" && <Invoices />}
      {page === "efatura" && <Efatura />}
      {page === "reports" && <Reports />}
      {page === "medula" && <Medula />}
      {page === "audit" && <Audit />}
      {page === "users" && <Users />}
    </Layout>
  );
}
