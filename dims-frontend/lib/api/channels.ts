import apiClient from "./client";
import type { Channel, ChannelMessage, CreateChannelInput } from "@/types/channel.types";

export const channelsApi = {
  listMine: () =>
    apiClient.get<Channel[]>("/channels"),

  listPublic: () =>
    apiClient.get<Channel[]>("/channels/public"),

  getById: (id: string) =>
    apiClient.get<Channel>(`/channels/${id}`),

  create: (payload: CreateChannelInput) =>
    apiClient.post<Channel>("/channels", payload),

  join: (id: string) =>
    apiClient.post(`/channels/${id}/join`),

  leave: (id: string) =>
    apiClient.delete(`/channels/${id}/leave`),

  addMember: (id: string, userId: string) =>
    apiClient.post(`/channels/${id}/members`, { userId }),

  removeMember: (id: string, userId: string) =>
    apiClient.delete(`/channels/${id}/members/${userId}`),

  getMessages: (id: string, params?: { before?: string; limit?: number }) =>
    apiClient.get<ChannelMessage[]>(`/channels/${id}/messages`, { params }),

  sendMessage: (id: string, body: string) =>
    apiClient.post<ChannelMessage>(`/channels/${id}/messages`, { body }),

  markRead: (id: string) =>
    apiClient.patch(`/channels/${id}/read`),
};
