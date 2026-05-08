import axios from "axios";

const API_BASE = "https://daliportal-api.daligeotech.com";
const TOKEN_KEY = "dali-token";

export const sellerApi = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

sellerApi.interceptors.request.use((c) => {
  const t =
    localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

export const toast = (msg, type = "success") => {
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.cssText = `position:fixed;bottom:32px;right:32px;background:${type === "error" ? "#e53e3e" : "#1a202c"};color:#fff;padding:16px 24px;border-radius:12px;font-size:15px;font-weight:700;z-index:9999;box-shadow:0 10px 15px -3px rgba(0,0,0,0.2)`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
};
