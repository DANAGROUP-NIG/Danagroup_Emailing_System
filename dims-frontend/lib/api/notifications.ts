import apiClient from "./client";
import type { AppNotification } from "@/types/api.types";

export interface NotificationListParams {
  page?: number;
  limit?: number;
}

export interface NotificationListResponse {
  data: AppNotification[];
  total: number;
  page: number;
  limit: number;
}

export const notificationsApi = {
  list: (params?: NotificationListParams) =>
    apiClient.get<NotificationListResponse>("/notifications", { params }),

  unreadCount: () =>
    apiClient.get<{ count: number }>("/notifications/unread-count"),

  markRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.patch("/notifications/read-all"),
};
