import axios from "axios";

const publicAuthPaths = [
  "/auth/register",
  "/auth/verify-email",
  "/auth/login",
  "/auth/google",
  "/auth/forgot-password",
  "/auth/verify-reset-code",
  "/auth/reset-password"
];

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  if (typeof window === "undefined") return config;

  const requestUrl = typeof config.url === "string" ? config.url : "";
  if (publicAuthPaths.some((path) => requestUrl.endsWith(path) || requestUrl === path)) {
    delete config.headers.Authorization;
    return config;
  }

  const token = localStorage.getItem("travel360_token") ?? localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      localStorage.removeItem("user");
      localStorage.removeItem("travel360_token");
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("travel360:unauthorized"));
    }

    return Promise.reject(error);
  }
);
