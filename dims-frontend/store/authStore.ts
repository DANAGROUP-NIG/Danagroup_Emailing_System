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
import { authApi, type SignupPayload, type LoginData } from "@/lib/api/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  pending2FAEmail: string | null;
  setUser: (user: User) => void;
  clearUser: () => void;
  login: (credentials: { email: string; password: string }) => Promise<{
    success: boolean;
    requires2FA?: boolean;
  }>;
  verifyTotp: (token: string) => Promise<boolean>;
  signup: (payload: SignupPayload) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      pending2FAEmail: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      clearUser: () => set({ user: null, isAuthenticated: false, pending2FAEmail: null }),
      login: async (credentials) => {
        try {
          const loginRes = await authApi.login(credentials);
          const loginData = loginRes.data?.data;

          if (loginData?.requires2FA) {
            set({ pending2FAEmail: loginData.email ?? credentials.email });
            return { success: false, requires2FA: true };
          }

          const meRes = await authApi.me();
          const user = meRes.data?.data ?? (meRes.data as unknown as User);
          set({ user, isAuthenticated: true, pending2FAEmail: null });
          return { success: true };
        } catch {
          return { success: false };
        }
      },
      verifyTotp: async (token) => {
        try {
          await authApi.verifyTotp(token);
          const meRes = await authApi.me();
          const user = meRes.data?.data ?? (meRes.data as unknown as User);
          set({ user, isAuthenticated: true, pending2FAEmail: null });
          return true;
        } catch {
          return false;
        }
      },
      signup: async (payload) => {
        try {
          await authApi.signup(payload);
          // const meRes = await authApi.me();
          // const user = meRes.data?.data ?? (meRes.data as unknown as User);
          // set({ user, isAuthenticated: true });
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
    },
  ),
);
