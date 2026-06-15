/**
 * Auth Store (Zustand) — UI-only state
 * Server state lives in TanStack Query. This store only holds:
 * - user: for quick UI access (hydrated from persist)
 * - isAuthenticated: derived from user presence
 * - setUser/clearUser: for auth hooks to sync server state
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/user.types";
import { authApi } from "@/lib/api/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      clearUser: () => set({ user: null, isAuthenticated: false }),
      login: async (credentials) => {
        try {
          await authApi.login(credentials);
          const meRes = await authApi.me();
          const user = meRes.data?.data ?? (meRes.data as unknown as User);
          set({ user, isAuthenticated: true });
          return true;
        } catch {
          return false;
        }
      },
      logout: async () => {
        try {
          await authApi.logout();
        } finally {
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: "dims-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      skipHydration: true,
    }
  )
);
