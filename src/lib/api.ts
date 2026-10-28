import axios from "axios";

export const API_URL =
  (import.meta.env.VITE_ASSOCIATE_API_URL as string | undefined) ?? "/api"
// "https://employee-management-api-8m8b.onrender.com"
;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const WS_URL = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`;
export default api;