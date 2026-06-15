import apiClient from "./client";
import type { Department, Subsidiary } from "@/types/user.types";

export interface CreateDepartmentPayload {
  name: string;
  subsidiaryId: string;
}

export interface UpdateDepartmentPayload {
  name?: string;
  subsidiaryId?: string;
}

export interface CreateSubsidiaryPayload {
  name: string;
  domain?: string;
  description?: string;
}

export interface UpdateSubsidiaryPayload {
  name?: string;
  domain?: string;
  description?: string;
}

export const departmentsApi = {
  list: (subsidiaryId?: string) =>
    apiClient.get<Department[]>("/departments", {
      params: subsidiaryId ? { subsidiaryId } : undefined,
    }),

  getById: (id: string) =>
    apiClient.get<Department>(`/departments/${id}`),

  create: (payload: CreateDepartmentPayload) =>
    apiClient.post<Department>("/departments", payload),

  update: (id: string, payload: UpdateDepartmentPayload) =>
    apiClient.patch<Department>(`/departments/${id}`, payload),

  delete: (id: string) =>
    apiClient.delete(`/departments/${id}`),

  listSubsidiaries: () =>
    apiClient.get<Subsidiary[]>("/departments/subsidiaries"),

  getSubsidiaryById: (id: string) =>
    apiClient.get<Subsidiary>(`/departments/subsidiaries/${id}`),

  createSubsidiary: (payload: CreateSubsidiaryPayload) =>
    apiClient.post<Subsidiary>("/departments/subsidiaries", payload),

  updateSubsidiary: (id: string, payload: UpdateSubsidiaryPayload) =>
    apiClient.patch<Subsidiary>(`/departments/subsidiaries/${id}`, payload),
};
