import { api } from "@/services/api";

export const authService = {
  login: (payload: { email: string; password: string }) => api.post("/auth/login", payload),
  register: (payload: { name: string; email: string; password: string; confirm_password?: string }) => api.post("/auth/register", payload),
  verifyEmail: (payload: { email: string; otp: string }) => api.post("/auth/verify-email", payload),
  googleLogin: (payload: { id_token: string }) => api.post("/auth/google", payload),
  forgotPassword: (payload: { email: string }) => api.post("/auth/forgot-password", payload),
  verifyResetCode: (payload: { email: string; code: string }) => api.post("/auth/verify-reset-code", payload),
  resetPassword: (payload: { reset_token: string; new_password: string }) => api.post("/auth/reset-password", payload),
};
