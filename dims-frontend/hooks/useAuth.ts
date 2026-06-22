"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import type { LoginProps, User } from "@/types/user.types";
import toast from "react-hot-toast";
import axios from "axios";

/**
 * Login mutation — on success, sets user and redirects to inbox
 */
export function useLogin() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation<User, Error, LoginProps>({
    mutationFn: async (credentials: LoginProps) => {
      const response = await api.post("/auth/login", credentials);
      const payload = response.data?.data ?? response.data;
      return payload.user as User;
    },
    onSuccess: (user) => {
      setUser(user);
      toast.success("Login successful", { position: "top-right" });
      router.push("/mail/inbox");
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const message = (error.response?.data as { message?: string })?.message || "Invalid email or password";
        toast.error(message, { position: "top-right" });
      } else if (error instanceof Error) {
        toast.error(error.message, { position: "top-right" });
      } else {
        toast.error("An unexpected error occurred.", { position: "top-right" });
      }
    },
  });
}

/**
 * Logout mutation — on success, clears user, clears query cache, redirects to login
 */
export function useLogout() {
  const router = useRouter();
  const clearUser = useAuthStore((s) => s.clearUser);
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSuccess: () => {
      clearUser();
      queryClient.clear();
      router.push("/login");
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const message = (error.response?.data as { message?: string })?.message ?? "Logout failed";
        toast.error(message, { position: "bottom-center" });
      }
    },
  });
}

/**
 * Get current user query — runs on mount, sets/clears user in store
 */
export function useMe() {
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);

  return useQuery<User | null, Error>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await api.get("/auth/me", { withCredentials: true });
      return res.data.data ?? null;
    },
    staleTime: 60 * 1000, // 1 minute
    retry: (failureCount, error) => {
      // Don't retry on 401
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Hook that syncs useMe query result with auth store
 * Use this in your root layout to keep store in sync with server state
 */
export function useAuthSync() {
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);
  const { data: user, isSuccess, error } = useMe();

  useEffect(() => {
    if (isSuccess) {
      if (user) {
        setUser(user);
      } else {
        clearUser();
      }
    }
    if (error && axios.isAxiosError(error) && error.response?.status === 401) {
      clearUser();
    }
  }, [user, isSuccess, error, setUser, clearUser]);
}

/**
 * Legacy hook for backward compatibility — returns user state from store
 * @deprecated Use useMe() for server state, useAuthStore for UI state directly
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return {
    user,
    isAuthenticated,
  };
}
