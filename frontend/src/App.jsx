import React, { useState } from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import Login from "./pages/Login";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [loggedIn, setLoggedIn] = useState(
    Boolean(localStorage.getItem("pharmamb_user"))
  );

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <Layout page={page} setPage={setPage}>
      {page === "dashboard" && <Dashboard />}
      {page === "products" && <Products />}
      {page === "sales" && <Sales />}
    </Layout>
  );
}
