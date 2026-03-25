import type { User } from "./user.types";

export type RecipientType = "to" | "cc" | "bcc";

export interface Thread {
  id: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
  lastMessage?: Message;
  unreadCount?: number;
  isStarred?: boolean;
}

export interface MessageRecipient {
  id: string;
  messageId: string;
  recipientId: string;
  recipient?: User;
  type: RecipientType;
  isRead: boolean;
  isStarred: boolean;
  isDeleted: boolean;
  isArchived: boolean;
  readAt?: string;
}

export interface Attachment {
  id: string;
  messageId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  createdAt: string;
}

export interface Message {
  id: string;
  threadId: string;
  thread?: Thread;
  senderId: string;
  sender?: User;
  subject: string;
  body: string;
  bodyHtml?: string;
  isDraft: boolean;
  sentAt?: string;
  createdAt: string;
  recipients?: MessageRecipient[];
  attachments?: Attachment[];
}

export interface ComposeData {
  to: User[];
  cc?: User[];
  bcc?: User[];
  subject: string;
  body: string;
  bodyHtml?: string;
  attachmentIds?: string[];
  threadId?: string;
  draftId?: string;
}

export interface Announcement {
  id: string;
  authorId: string;
  author?: User;
  title: string;
  body: string;
  target: "all" | "subsidiary" | "department";
  subsidiaryId?: string;
  departmentId?: string;
  isPinned: boolean;
  publishedAt?: string;
  createdAt: string;
}
