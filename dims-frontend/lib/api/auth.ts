import apiClient from "./client";
import type { ApiResponse } from "@/types/api.types";
import type { Subsidiary, User } from "@/types/user.types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  departmentId: string;
  jobTitle?: string;
}

export interface LoginData {
  user: Pick<User, "id" | "email" | "firstName" | "lastName" | "role">;
}

export interface SignupOptionsData {
  subsidiaries: Subsidiary[];
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<ApiResponse<LoginData>>("/auth/login", payload),

  signup: (payload: SignupPayload) =>
    apiClient.post<ApiResponse<LoginData>>("/auth/signup", payload),

  signupOptions: () =>
    apiClient.get<ApiResponse<SignupOptionsData>>("/auth/signup-options"),

  logout: () => apiClient.post<ApiResponse<never>>("/auth/logout"),

  refresh: () => apiClient.post<ApiResponse<never>>("/auth/refresh", {}),

  me: () => apiClient.get<ApiResponse<User>>("/auth/me"),

  requestPasswordReset: (email: string) =>
    apiClient.post<ApiResponse<never>>("/auth/forgot-password", { email }),

  resetPassword: (data: { token: string; password: string }) =>
    apiClient.post<ApiResponse<never>>("/auth/reset-password", data),
};
