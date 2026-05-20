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
import type { LoginProps, User } from "@/types/user.types";
import api from "@/lib/api";
import axios from "axios";
import toast from "react-hot-toast";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  checkingAuth: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  login: (data: LoginProps) => Promise<boolean>;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  errors: Record<string, string>;
}

// export const useAuthStore = create<AuthState>()(
//   persist(
//     (set) => ({
//       user: null,
//       isAuthenticated: false,
//       isLoading: false,
//       setUser: (user) => set({ user, isAuthenticated: true }),
//       clearUser: () => set({ user: null, isAuthenticated: false }),
//       setLoading: (isLoading) => set({ isLoading }),
//     }),
//     { name: "dims-auth" }
//   )
// );


export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      errors: {},
      checkingAuth: false,
      login: async ({email, password}: LoginProps) => {
        set({ isLoading: true});

        try {
          const response = await api.post("/auth/login", {email, password});
          const payload = response.data?.data ?? response.data;
          const { user } = payload;

          set({
            user,
            isAuthenticated: true,
            isLoading: false
          });

          toast.success("Login successful", {position: "top-right"});

          return true;
        } catch (error) {
          set({isLoading: false})

          if (axios.isAxiosError(error)) {
            const message = (error.response?.data as { message?: string})?.message || "Invalid email or password";
            toast.error(message, {position: "top-right"})
          } else if (error instanceof Error) {
            toast.error(error.message, {position: "top-right"});
          } else {
            toast.error("An unexpected error occurred.", {position: "top-right"});
          }
          
          return false;
        }
      },

      logout: async () => {
      try {
        await api.post("/auth/logout");
        set({ user: null, isAuthenticated: false });
      } catch (error: any) {
        toast.error(error.response?.data?.message, {position: "bottom-center"})
      }
    },

    checkAuth: async () => {
      set({checkingAuth: true})

      try {
        const res = await api.get("/auth/me", {
          withCredentials: true,
        });

        set({
          user: res.data.data ?? null,
          isAuthenticated: !!res.data.data,
          checkingAuth: false,
        });
      } catch (error) {
         set({ checkingAuth: false, user: null, isAuthenticated: false });
      }
    },

    refreshToken: async () => {
      // Prevent multiple simultaneous refresh attempts
      if (get().checkingAuth) return;

      set({checkingAuth: true});

      try {
        const res = await api.post("/auth/refresh", {}, {withCredentials: true});
        set({ checkingAuth: false });
        await get().checkAuth();
        return res.data;
      } catch (error) {
        set({ user: null, checkingAuth: false, isAuthenticated: false });
      }
    },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      clearUser: () => set({ user: null, isAuthenticated: false}),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    { 
      name: "dims-auth",
      partialize: (state) => ({
        user: state.user
          ? {
              ...state.user,
              accessToken: undefined,
              refreshToken: undefined,
            }
          : null,
        isAuthenticated: state.isAuthenticated,
      }),
      // Optional: skips hydration during SSR to avoid mismatch errors
      skipHydration: true, 
    }
  )
);
