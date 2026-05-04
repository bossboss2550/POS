import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "@/types";

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  setToken: (token: string) => void;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null, token: null, isAuthenticated: false,
      setAuth: (user, token) => {
        // Normalize role to lowercase so it matches UserRole type ("ADMIN" → "admin")
        const normalizedUser = { ...user, role: user.role?.toLowerCase() as UserRole };
        localStorage.setItem("pos_token", token);
        set({ user: normalizedUser, token, isAuthenticated: true });
      },
      setToken: (token) => {
        localStorage.setItem("pos_token", token);
        set({ token });
      },
      logout: () => {
        localStorage.removeItem("pos_token");
        set({ user: null, token: null, isAuthenticated: false });
      },
      hasRole: (...roles) => {
        const user = get().user;
        // Normalize role for comparison (API may return uppercase "ADMIN")
        const role = user?.role?.toLowerCase() as UserRole | undefined;
        return !!user && !!role && roles.includes(role);
      },
    }),
    { name: "pos-auth", partialize: state => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }) }
  )
);
