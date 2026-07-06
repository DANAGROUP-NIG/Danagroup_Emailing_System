import apiClient from "./client";
import type { ChatConversation, ChatMessage } from "@/types/chat.types";

export interface GetMessagesParams {
  before?: string;
  limit?: number;
}

export const chatApi = {
  listConversations: () =>
    apiClient.get<ChatConversation[]>("/chat/conversations"),

  getOrCreateConversation: (recipientId: string) =>
    apiClient.post<ChatConversation>("/chat/conversations", { recipientId }),

  getMessages: (conversationId: string, params?: GetMessagesParams) =>
    apiClient.get<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`, { params }),

  sendMessage: (recipientId: string, body: string) =>
    apiClient.post<ChatMessage>("/chat/messages", { recipientId, body }),

  markRead: (conversationId: string) =>
    apiClient.patch(`/chat/conversations/${conversationId}/read`),

  getUnreadCount: () =>
    apiClient.get<{ count: number }>("/chat/unread-count"),
};
