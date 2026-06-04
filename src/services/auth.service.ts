import { api } from "@/services/api";

export type UpdateProfilePayload = {
  name?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  profile_info?: string;
  avatar_file?: File | null;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export const authService = {
  login: (payload: { email: string; password: string }) => api.post("/auth/login", payload),
  register: (payload: { name: string; email: string; password: string; confirm_password?: string }) => api.post("/auth/register", payload),
  verifyEmail: (payload: { email: string; otp: string }) => api.post("/auth/verify-email", payload),
  googleLogin: (payload: { id_token: string }) => api.post("/auth/google", payload),
  getProfile: () => api.get("/auth/profile"),
  changePassword: (payload: ChangePasswordPayload) => api.put("/auth/change-password", payload),
  updateProfile: (payload: UpdateProfilePayload) => {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === "avatar_file" && value instanceof File) {
        formData.append(key, value);
        return;
      }
      formData.append(key, String(value));
    });

    return api.put("/auth/profile", formData);
  }
};
