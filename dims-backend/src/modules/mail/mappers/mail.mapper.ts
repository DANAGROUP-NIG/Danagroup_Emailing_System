import { MessageRecipient } from "../entities/message-recipient.entity";
import { Message } from "../entities/message.entity";
import { Thread } from "../entities/thread.entity";
import { UserThreadState } from "../entities/UserThreadState.entity";

type UserSummary = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
};

const STORAGE_KEY_PREFIXES = [
  "avatars/",
  "attachments/",
  "uploads/",
  "exports/",
  "imports/",
  "logos/",
  "signatures/",
];

function resolveAvatarUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://"))
    return rawUrl;
  const isKey = STORAGE_KEY_PREFIXES.some((p) => rawUrl.startsWith(p));
  if (!isKey) return rawUrl;

  const publicUrl = process.env.MINIO_PUBLIC_URL;
  const bucket = process.env.MINIO_BUCKET ?? "dims-files";
  if (publicUrl) return `${publicUrl.replace(/\/$/, "")}/${bucket}/${rawUrl}`;

  const host = process.env.MINIO_ENDPOINT ?? "localhost";
  const port = process.env.MINIO_PORT ?? "9000";
  const ssl = process.env.MINIO_USE_SSL === "true";
  return `${ssl ? "https" : "http"}://${host}:${port}/${bucket}/${rawUrl}`;
}

type ThreadWithOptionalState = Thread & {
  userState?: UserThreadState | null;
};

export class MailMapper {
  static toSenderSummary(user: UserSummary | null | undefined) {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      avatarUrl: resolveAvatarUrl(user.avatarUrl),
    };
  }

  static getLatestMessage(thread: Thread): Message | null {
    if (!thread.messages?.length) {
      return null;
    }

    return [...thread.messages].sort((a, b) => {
      const left = a.sentAt ?? a.createdAt;
      const right = b.sentAt ?? b.createdAt;
      return right.getTime() - left.getTime();
    })[0];
  }

  static getUserState(
    thread: ThreadWithOptionalState,
    currentUserId?: string,
  ): UserThreadState | null {
    if (thread.userState !== undefined) {
      return thread.userState;
    }

    if (!currentUserId || !Array.isArray(thread.userStates)) {
      return null;
    }

    return (
      thread.userStates.find(
        (userState) => userState.userId === currentUserId,
      ) ?? null
    );
  }

  static toParticipant(user: UserSummary | null | undefined) {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: [user.firstName, user.lastName].filter(Boolean).join(" ").trim(),
      avatarUrl: resolveAvatarUrl(user.avatarUrl),
    };
  }

  static getVisibleRecipients(message: Message, currentUserId?: string) {
    return (message.recipients ?? []).filter(
      (recipient) =>
        recipient.type !== "bcc" ||
        message.senderId === currentUserId ||
        recipient.recipientId === currentUserId,
    );
  }

  static toListMessage(message: Message, currentUserId?: string) {
    return {
      id: message.id,
      threadId: message.threadId,
      body: message.body,
      bodyHtml: message.bodyHtml,
      createdAt: message.createdAt,
      sentAt: message.sentAt,
      sender: this.toSenderSummary(message.sender),
      recipients: this.getVisibleRecipients(message, currentUserId).map(
        (recipient) => this.toRecipient(recipient),
      ),
    };
  }

  static toRecipient(recipient: MessageRecipient) {
    const participant = this.toParticipant(recipient.recipient);

    return {
      id: recipient.id,
      type: recipient.type,
      recipientId: recipient.recipientId,
      email: participant?.email ?? null,
      name: participant?.name ?? "",
      avatarUrl: participant?.avatarUrl ?? null,
      isRead: recipient.isRead,
      isStarred: recipient.isStarred,
      isDeleted: recipient.isDeleted,
      readAt: recipient.readAt,
      deletedAt: recipient.deletedAt,
      recipient: participant,
    };
  }

  static toMessage(message: Message, currentUserId?: string) {
    const currentRecipient = currentUserId
      ? (message.recipients?.find(
          (recipient) => recipient.recipientId === currentUserId,
        ) ?? null)
      : null;

    return {
      id: message.id,
      threadId: message.threadId,
      subject: message.subject,
      body: message.body,
      bodyHtml: message.bodyHtml,
      isDraft: message.isDraft,
      sentAt: message.sentAt,
      createdAt: message.createdAt,
      senderDeletedAt: message.senderDeletedAt,
      sender: this.toParticipant(message.sender),
      recipients: this.getVisibleRecipients(message, currentUserId).map(
        (recipient) => this.toRecipient(recipient),
      ),
      attachments:
        message.attachments?.map((attachment) => ({
          id: attachment.id,
          filename: attachment.filename,
          mimeType: attachment.mime_type,
          sizeBytes: attachment.sizeBytes,
          storageKey: attachment.storageKey,
        })) ?? [],
      isRead:
        message.senderId === currentUserId
          ? true
          : (currentRecipient?.isRead ?? false),
      isStarred: currentRecipient?.isStarred ?? false,
      preview: message.body?.slice(0, 120) ?? "",
    };
  }

  static toThreadBase(thread: ThreadWithOptionalState, currentUserId?: string) {
    const latest = this.getLatestMessage(thread);
    const userState = this.getUserState(thread, currentUserId);

    return {
      id: thread.id,
      subject: thread.subject,
      unreadCount: userState?.unreadCount ?? 0,
      isStarred: userState?.isStarred ?? false,
      updatedAt: thread.lastMessageAt ?? thread.lastActivityAt,
      latestMessage: latest ? this.toListMessage(latest, currentUserId) : null,
    };
  }

  static toThreadDetail(
    threadId: string,
    messages: Message[],
    currentUserId: string,
  ) {
    return {
      threadId,
      messages: messages.map((message) =>
        this.toMessage(message, currentUserId),
      ),
    };
  }

  static toSendMailResponse(message: {
    id: string;
    threadId: string;
    sentAt: Date;
  }) {
    return {
      messageId: message.id,
      threadId: message.threadId,
      sentAt: message.sentAt,
      status: "sent",
    };
  }
}
