import apiClient from "./client";
import type { User } from "@/types/user.types";

export interface ListUsersParams {
  search?: string | undefined;
  department?: string | undefined;
  subsidiary?: string | undefined;
  role?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
  sortBy?: "firstName" | "department" | "createdAt" | undefined;
}

export interface SearchUsersParams {
  search?: string | undefined;
  department?: string | undefined;
  subsidiary?: string | undefined;
  role?: string | undefined;
  limit?: number | undefined;
  page?: number | undefined;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password?: string | undefined;
  department?: string | undefined;
  subsidiary?: string | undefined;
  avatarUrl?: string | undefined;
  role?: string | undefined;
  jobTitle?: string | undefined;
}

export interface UpdateUserPayload {
  firstName?: string | undefined;
  lastName?: string | undefined;
  jobTitle?: string | undefined;
  phone?: string | undefined;
  bio?: string | undefined;
  avatarUrl?: string | undefined;
  role?: string | undefined;
  department?: string | undefined;
  subsidiary?: string | undefined;
}

export interface UsersListResponse {
  data: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export const usersApi = {
  list: (params?: ListUsersParams, signal?: AbortSignal) =>
    apiClient.get<UsersListResponse>("/users", { params, ...(signal ? { signal } : {}) }),

  search: (params: SearchUsersParams, signal?: AbortSignal) =>
    apiClient.get("/users/search", { params, ...(signal ? { signal } : {}) }),

  getById: (id: string) =>
    apiClient.get<User>(`/users/${id}`),

  create: (payload: CreateUserPayload) =>
    apiClient.post<User>("/users", payload),

  update: (id: string, payload: UpdateUserPayload) =>
    apiClient.patch<User>(`/users/${id}`, payload),

  deactivate: (id: string) =>
    apiClient.delete(`/users/${id}`),

  changeAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<{ data: { avatarUrl: string } }>("/files/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getSignature: () =>
    apiClient.get<{ signature: string | null }>("/users/me/signature"),

  updateSignature: (signature: string | null) =>
    apiClient.patch<{ signature: string | null }>("/users/me/signature", { signature }),
};
