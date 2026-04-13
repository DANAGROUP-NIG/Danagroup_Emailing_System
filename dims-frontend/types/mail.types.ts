import { number } from "zod";
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
  sender: User;
  subject: string;
  body: string;
  bodyHtml?: string;
  isDraft: boolean;
  sentAt?: string;
  createdAt: string;
  recipients: MessageRecipient[];
  attachments?: Attachment[];
  latestMessage: Message;
}

export interface InboxMessage {
  id: string;
  subject: string;
  latestMessage: Message;
  unreadCount?: number;
  message?: Message;
}

export interface ComposeData {
  subject: string;
  body: string;
  bodyHtml?: string;
  attachmentIds?: string[];
  threadId?: string;
  draftId?: string;
  isDraft?: boolean;
  recipients: {
    recipient_id: string;
    type: 'to' | 'cc' | 'bcc';
  } [];
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


export type MailFolder = 'inbox' | 'sent' | 'drafts' | 'starred' | 'spam' | 'trash' | 'all';

export type MailLabel = 'important' | 'work' | 'personal';


export interface MailListItem {
  id: string; // Thread ID
  subject: string;
  unreadCount: number;
  updatedAt: string;
  latestMessage: Message; // The full message object with sender, body, etc.
}
