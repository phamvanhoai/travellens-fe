import { create } from "zustand";

type AuthState = {
  user: any | null;
  setUser: (user: any | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("travel360_token");
    }
    set({ user: null });
  }
}));
