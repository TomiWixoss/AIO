import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Admin, authApi } from "@/lib/api";

interface AuthState {
  token: string | null;
  admin: Admin | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      admin: null,
      isLoading: true,

      login: async (email, password) => {
        const res = await authApi.login(email, password);
        const { token, admin } = res.data.data;
        localStorage.setItem("token", token);
        set({ token, admin });
      },

      register: async (email, password, name) => {
        const res = await authApi.register(email, password, name);
        const { token, admin } = res.data.data;
        localStorage.setItem("token", token);
        set({ token, admin });
      },

      logout: () => {
        localStorage.removeItem("token");
        set({ token: null, admin: null });
      },

      checkAuth: async () => {
        const token = localStorage.getItem("token");
        if (!token) {
          set({ isLoading: false });
          return;
        }
        try {
          const res = await authApi.me();
          set({ token, admin: res.data.data, isLoading: false });
        } catch {
          localStorage.removeItem("token");
          set({ token: null, admin: null, isLoading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ token: state.token, admin: state.admin }),
    }
  )
);
