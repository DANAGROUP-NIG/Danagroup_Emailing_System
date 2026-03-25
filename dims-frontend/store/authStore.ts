// TODO: Implement Auth Store (Zustand)
// Interface:
//   user: User | null
//   isAuthenticated: boolean
//   isLoading: boolean
//   setUser: (user: User) => void
//   clearUser: () => void
//   setLoading: (loading: boolean) => void

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/user.types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      clearUser: () => set({ user: null, isAuthenticated: false }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    { name: "dims-auth" }
  )
);
