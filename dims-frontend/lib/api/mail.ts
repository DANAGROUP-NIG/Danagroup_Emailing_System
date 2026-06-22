import apiClient from "./client";
import type { BackendPageResponse } from "@/types/api.types";
import type {
  ComposeData,
  DraftMessage,
  MailThreadSummary,
  ThreadDetail,
  ThreadMessage,
} from "@/types/mail.types";

export interface MailPageParams {
  page?: number;
  limit?: number;
}

export const mailApi = {
  getInbox: (params?: MailPageParams) =>
    apiClient.get<BackendPageResponse<MailThreadSummary>>("/mail/inbox", { params }),

  getSent: (params?: MailPageParams) =>
    apiClient.get<BackendPageResponse<MailThreadSummary>>("/mail/sent", { params }),

  getDrafts: (params?: MailPageParams) =>
    apiClient.get<BackendPageResponse<DraftMessage>>("/mail/drafts", { params }),

  getStarred: (params?: MailPageParams) =>
    apiClient.get<BackendPageResponse<MailThreadSummary>>("/mail/starred", { params }),

  getTrash: (params?: MailPageParams) =>
    apiClient.get<BackendPageResponse<MailThreadSummary>>("/mail/trash", { params }),

  getThread: (threadId: string) =>
    apiClient.get<ThreadDetail>(`/mail/threads/${threadId}`),

  getMessage: (messageId: string) =>
    apiClient.get<ThreadMessage>(`/mail/messages/${messageId}`),

  send: (payload: ComposeData) =>
    apiClient.post<{ success: true; data: ThreadMessage }>("/mail/send", payload),

  saveDraft: (payload: ComposeData) =>
    apiClient.post<ThreadMessage>("/mail/draft", payload),

  markRead: (id: string, isRead: boolean) =>
    apiClient.patch(`/mail/messages/${id}/read`, { isRead }),

  markManyRead: (messageIds: string[]) =>
    apiClient.patch("/mail/messages/read", { messageIds }),

  markThreadRead: (threadId: string) =>
    apiClient.patch(`/mail/threads/${threadId}/read`),

  toggleStar: (id: string, isStarred: boolean) =>
    apiClient.patch(`/mail/${id}/star`, { isStarred }),

  moveToTrash: (id: string) =>
    apiClient.delete(`/mail/${id}`),

  restore: (id: string) =>
    apiClient.patch(`/mail/${id}/restore`),

  emptyTrash: () =>
    apiClient.delete("/mail/trash/empty"),

  permanentDelete: (id: string) =>
    apiClient.delete(`/mail/messages/${id}/permanent`),

  deleteDraft: (id: string) =>
    apiClient.delete(`/mail/drafts/${id}`),
};
