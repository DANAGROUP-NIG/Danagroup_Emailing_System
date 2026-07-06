export interface ChatParticipant {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  email?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  sender?: ChatParticipant | null;
}

export interface ChatConversation {
  id: string;
  participantAId: string;
  participantBId: string;
  lastMessageId?: string | null;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
  participantA: ChatParticipant;
  participantB: ChatParticipant;
  unreadCount?: number;
  lastMessage?: ChatMessage | null;
}

export interface SendMessagePayload {
  recipientId: string;
  body: string;
}
