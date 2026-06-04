import { api } from "@/services/api";

export const authService = {
  login: (payload: { email: string; password: string }) => api.post("/auth/login", payload),
  register: (payload: { name: string; email: string; password: string; confirm_password?: string }) => api.post("/auth/register", payload),
  verifyEmail: (payload: { email: string; otp: string }) => api.post("/auth/verify-email", payload),
  googleLogin: (payload: { id_token: string }) => api.post("/auth/google", payload),
};
