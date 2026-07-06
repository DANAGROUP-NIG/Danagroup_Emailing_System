import type { ChatParticipant, ChatMessage } from "./chat.types";

export type ChannelType = "public" | "private";
export type ChannelRole = "owner" | "admin" | "member";

export interface ChannelMember {
  id: string;
  channelId: string;
  userId: string;
  role: ChannelRole;
  lastReadAt?: string | null;
  joinedAt: string;
  user: ChatParticipant;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender?: ChatParticipant | null;
}

export interface Channel {
  id: string;
  name: string;
  description?: string | null;
  type: ChannelType;
  createdById: string;
  isArchived: boolean;
  lastMessageId?: string | null;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: ChatParticipant;
  members?: ChannelMember[];
  unreadCount?: number;
  lastMessage?: ChannelMessage | null;
  memberCount?: number;
}

export interface CreateChannelInput {
  name: string;
  description?: string | undefined;
  type?: ChannelType | undefined;
  memberIds?: string[] | undefined;
}
