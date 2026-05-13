import type { User } from "./user.types";

export type RecipientType = "to" | "cc" | "bcc";

export interface Attachment {
  id: string;
  messageId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  createdAt?: string;
}

export interface SenderSummary {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
}

export interface ParticipantSummary {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

export interface MessageRecipient {
  id: string;
  type: RecipientType;
  recipientId: string;
  email?: string | null;
  name?: string;
  avatarUrl?: string | null;
  isRead: boolean;
  isStarred: boolean;
  isDeleted: boolean;
  isArchived?: boolean;
  readAt?: string | null;
  deletedAt?: string | null;
  recipient?: ParticipantSummary;
}

export interface MailListMessage {
  id: string;
  threadId: string;
  body: string;
  bodyHtml?: string | null;
  createdAt: string;
  sentAt?: string | null;
  sender: SenderSummary | null;
  recipients?: MessageRecipient[];
}

export interface ThreadMessage {
  id: string;
  threadId: string;
  subject: string;
  body: string;
  bodyHtml?: string | null;
  isDraft: boolean;
  sentAt?: string | null;
  createdAt: string;
  senderDeletedAt?: string | null;
  sender: ParticipantSummary | null;
  recipients: MessageRecipient[];
  attachments: Attachment[];
  isRead: boolean;
  isStarred: boolean;
  preview: string;
}

export interface MailThreadSummary {
  id: string;
  subject: string;
  unreadCount: number;
  isStarred?: boolean;
  updatedAt?: string;
  latestMessage: MailListMessage | null;
}

export interface ThreadDetail {
  threadId: string;
  messages: ThreadMessage[];
}

export interface DraftMessage {
  id: string;
  threadId: string;
  subject: string;
  body: string;
  bodyHtml?: string | null;
  isDraft: boolean;
  createdAt: string;
  sentAt?: string | null;
  sender?: SenderSummary | null;
  recipients: MessageRecipient[];
  attachments: Attachment[];
}

export interface Thread {
  id: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
  messages?: ThreadMessage[];
  lastMessage?: ThreadMessage;
  unreadCount?: number;
  isStarred?: boolean;
}

export type Message = ThreadMessage;
export type SentMail = MailThreadSummary;
export type InboxMessage = MailThreadSummary;

export interface ComposeFormState {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
}

export interface ComposeData {
  subject: string;
  body: string;
  bodyHtml?: string;
  attachmentIds?: string[];
  threadId?: string;
  draftId?: string;
  isDraft?: boolean;
  toEmails?: string[];
  ccEmails?: string[];
  bccEmails?: string[];
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

export type MailFolder =
  | "inbox"
  | "sent"
  | "drafts"
  | "starred"
  | "trash";

export type MailLabel = "important" | "work" | "personal";

export interface MailListItem {
  id: string;
  subject: string;
  unreadCount: number;
  updatedAt?: string;
  latestMessage: MailListMessage | null;
}
