import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pharmamb_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function storeSession({ token, user }) {
  if (token) {
    localStorage.setItem("pharmamb_token", token);
  }
  if (user) {
    localStorage.setItem("pharmamb_user", JSON.stringify(user));
  }
}

export function clearSession() {
  localStorage.removeItem("pharmamb_token");
  localStorage.removeItem("pharmamb_user");
}

export function getStoredUser() {
  const raw = localStorage.getItem("pharmamb_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default api;
