import apiClient from "./client";
import type { Announcement, CreateAnnouncementInput, UpdateAnnouncementInput } from "@/types/announcement.types";

export interface AnnouncementListParams {
  page?: number;
  limit?: number;
  isPinned?: boolean;
  target?: string;
  subsidiaryId?: string;
  departmentId?: string;
}

export interface AnnouncementListResponse {
  data: Announcement[];
  total: number;
  page: number;
  limit: number;
}

export const announcementsApi = {
  list: (params?: AnnouncementListParams) =>
    apiClient.get<AnnouncementListResponse>("/announcements", { params }),

  getById: (id: string) =>
    apiClient.get<Announcement>(`/announcements/${id}`),

  create: (payload: CreateAnnouncementInput) =>
    apiClient.post<Announcement>("/announcements", payload),

  update: (id: string, payload: UpdateAnnouncementInput) =>
    apiClient.patch<Announcement>(`/announcements/${id}`, payload),

  togglePin: (id: string) =>
    apiClient.patch<Announcement>(`/announcements/${id}/pin`),

  delete: (id: string) =>
    apiClient.delete(`/announcements/${id}`),
};
