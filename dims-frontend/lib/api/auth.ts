import apiClient from "./client";
import type { ApiResponse } from "@/types/api.types";
import type { User } from "@/types/user.types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginData {
  user: Pick<User, "id" | "email" | "firstName" | "lastName" | "role">;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<ApiResponse<LoginData>>("/auth/login", payload),

  logout: () =>
    apiClient.post<ApiResponse<never>>("/auth/logout"),

  refresh: () =>
    apiClient.post<ApiResponse<never>>("/auth/refresh", {}),

  me: () =>
    apiClient.get<ApiResponse<User>>("/auth/me"),

  requestPasswordReset: (email: string) =>
    apiClient.post<ApiResponse<never>>("/auth/forgot-password", { email }),

  resetPassword: (data: { token: string; password: string }) =>
    apiClient.post<ApiResponse<never>>("/auth/reset-password", data),
};
