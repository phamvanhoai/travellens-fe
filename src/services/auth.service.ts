import { api } from "@/services/api";

export const authService = {
  login: (payload: { email: string; password: string }) => api.post("/auth/login", payload),
  register: (payload: { name: string; email: string; password: string }) => api.post("/auth/register", payload),
  google: () => api.get("/auth/google")
};
