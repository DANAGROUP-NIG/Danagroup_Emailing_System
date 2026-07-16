import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Brackets,
  DataSource,
  EntityManager,
  Repository,
  SelectQueryBuilder,
} from "typeorm";
import {
  MessageRecipient,
  RecipientType,
} from "./entities/message-recipient.entity";
import { Message } from "./entities/message.entity";
import { Thread } from "./entities/thread.entity";
import { UserThreadState } from "./entities/UserThreadState.entity";
import { User } from "../users/entities/user.entity";
import { MailboxChangedPayload, MailGateway } from "./mail.gateway";

export type MailboxResponse<T> = {
  data: T[];
  total: number;
  page: number;
  lastPage: number;
};

export type RecipientInput = {
  recipientId: string | null;
  type: RecipientType;
  externalEmail?: string;
};

export type ThreadFolder = "inbox" | "sent" | "starred" | "trash";

@Injectable()
export class MailCoreService {
  readonly logger = new Logger(MailCoreService.name);

  constructor(
    readonly dataSource: DataSource,
    @InjectRepository(Message)
    readonly messageRepo: Repository<Message>,
    @InjectRepository(Thread)
    readonly threadRepo: Repository<Thread>,
    @InjectRepository(MessageRecipient)
    readonly recipientRepo: Repository<MessageRecipient>,
    @InjectRepository(UserThreadState)
    readonly userThreadStateRepo: Repository<UserThreadState>,
    @InjectRepository(User)
    readonly userRepo: Repository<User>,
    readonly mailGateway: MailGateway,
  ) {}

  // ─── Error handler ────────────────────────────────────────────────────────

  handleError(method: string, error: Error & { stack?: string }): never {
    this.logger.error(`${method} failed: ${error.message}`, error.stack);
    throw error;
  }

  // ─── Utilities ────────────────────────────────────────────────────────────

  normalizePagination(query: { page?: number; limit?: number }) {
    return {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
  }

  uniqueFolders(folders: string[]) {
    return [...new Set(folders)];
  }

  getUserMailboxFoldersForMessage(message: Message, userId: string) {
    const folders: string[] = [];

    if (message.senderId === userId) {
      folders.push(message.senderDeletedAt ? "trash" : "sent");
    }

    const recipient = message.recipients?.find(
      (item) => item.recipientId === userId,
    );

    if (recipient) {
      folders.push(recipient.isDeleted ? "trash" : "inbox");
      if (recipient.isStarred) folders.push("starred");
    }

    return this.uniqueFolders(folders);
  }

  isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  compareMessages(
    left: Message,
    right: Message,
    direction: "ASC" | "DESC" = "DESC",
  ) {
    const leftDate = left.sentAt ?? left.createdAt;
    const rightDate = right.sentAt ?? right.createdAt;
    const diff = leftDate.getTime() - rightDate.getTime();
    return direction === "ASC" ? diff : -diff;
  }

  // ─── Message visibility ───────────────────────────────────────────────────

  isMessageVisibleToUser(message: Message, userId: string) {
    if (message.senderId === userId) {
      return !message.senderDeletedAt;
    }
    const recipient = message.recipients?.find(
      (item) => item.recipientId === userId,
    );
    return !!recipient && !recipient.isDeleted;
  }

  isMessageInTrashForUser(message: Message, userId: string) {
    if (message.senderId === userId && !!message.senderDeletedAt) {
      return true;
    }
    const recipient = message.recipients?.find(
      (item) => item.recipientId === userId,
    );
    return !!recipient?.isDeleted;
  }

  isMessageStarredForUser(message: Message, userId: string) {
    const recipient = message.recipients?.find(
      (item) => item.recipientId === userId,
    );
    return !!recipient && !recipient.isDeleted && recipient.isStarred;
  }

  // ─── Gateway emit helpers ─────────────────────────────────────────────────

  emitMailboxChanged(userId: string, payload: MailboxChangedPayload) {
    this.mailGateway.emitMailboxChanged(userId, payload);
  }

  emitMailReadEvent(
    userId: string,
    messageId: string,
    threadId: string,
    readAt: Date | null,
  ) {
    this.mailGateway.emitMailRead(userId, {
      messageId,
      threadId,
      isRead: !!readAt,
      readAt: readAt?.toISOString() ?? null,
    });
  }

  // ─── Thread state refresh ─────────────────────────────────────────────────

  async refreshThreadMetadata(
    manager: EntityManager,
    threadId: string,
    fallbackSubject?: string,
  ) {
    const thread = await manager.findOne(Thread, {
      where: { id: threadId },
      relations: { messages: true },
    });

    if (!thread) return;

    const latestMessage = [...(thread.messages ?? [])]
      .filter((message) => !message.isDraft)
      .sort((left, right) => this.compareMessages(left, right))[0];

    thread.lastActivityAt =
      latestMessage?.sentAt ??
      latestMessage?.createdAt ??
      thread.lastActivityAt ??
      new Date();
    thread.lastMessageAt =
      latestMessage?.sentAt ?? latestMessage?.createdAt ?? null;
    thread.snippet =
      latestMessage?.body?.slice(0, 140) ?? thread.snippet ?? null;

    if (
      fallbackSubject &&
      (!thread.subject || thread.subject === "No Subject")
    ) {
      thread.subject = fallbackSubject;
    }

    await manager.save(thread);
  }

  async refreshUserThreadState(
    manager: EntityManager,
    threadId: string,
    userId: string,
  ) {
    const aggregate = await manager
      .createQueryBuilder(MessageRecipient, "recipient")
      .innerJoin(Message, "message", "message.id = recipient.messageId")
      .where("message.threadId = :threadId", { threadId })
      .andWhere("recipient.recipientId = :userId", { userId })
      .andWhere("message.isDraft = false")
      .andWhere("recipient.isDeleted = false")
      .select("COUNT(recipient.id)", "visibleCount")
      .addSelect(
        "COUNT(CASE WHEN recipient.isRead = false THEN 1 END)",
        "unreadCount",
      )
      .addSelect(
        "MAX(CASE WHEN recipient.isStarred = true THEN 1 ELSE 0 END)",
        "isStarred",
      )
      .getRawOne<{
        visibleCount: string;
        unreadCount: string;
        isStarred: string;
      }>();

    const visibleCount = Number(aggregate?.visibleCount ?? 0);

    if (!visibleCount) {
      await manager.delete(UserThreadState, { threadId, userId });
      return;
    }

    await manager.upsert(
      UserThreadState,
      {
        threadId,
        userId,
        unreadCount: Number(aggregate?.unreadCount ?? 0),
        isStarred: Number(aggregate?.isStarred ?? 0) > 0,
        isRead: Number(aggregate?.unreadCount ?? 0) === 0,
      },
      ["userId", "threadId"],
    );
  }

  async refreshThreadAfterMutation(
    manager: EntityManager,
    threadId: string,
    fallbackSubject?: string,
  ) {
    await this.refreshThreadMetadata(manager, threadId, fallbackSubject);

    const recipients = await manager
      .createQueryBuilder(MessageRecipient, "recipient")
      .innerJoin(Message, "message", "message.id = recipient.messageId")
      .where("message.threadId = :threadId", { threadId })
      .select("DISTINCT recipient.recipientId", "userId")
      .getRawMany<{ userId: string }>();

    await Promise.all(
      recipients.map((recipient) =>
        this.refreshUserThreadState(manager, threadId, recipient.userId),
      ),
    );
  }

  // ─── Recipient helpers ────────────────────────────────────────────────────

  dedupeRecipients(recipients: RecipientInput[]) {
    const seen = new Set<string>();
    return recipients.filter((recipient) => {
      const key = recipient.externalEmail ?? recipient.recipientId ?? "";
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async replaceRecipients(
    manager: EntityManager,
    messageId: string,
    recipients: RecipientInput[],
  ) {
    await manager.delete(MessageRecipient, { messageId });

    if (!recipients.length) return;

    const entities = recipients.map((r) =>
      manager.create(MessageRecipient, {
        messageId,
        type: r.type,
        recipientId: r.recipientId ?? null,
        externalEmail: r.externalEmail ?? null,
      }),
    );
    await manager.save(entities);

    const persistedCount = await manager.count(MessageRecipient, {
      where: { messageId },
    });

    if (persistedCount !== recipients.length) {
      throw new Error("Failed to persist all message recipients");
    }
  }

  async getMessageOrFail(manager: EntityManager, messageId: string) {
    const message = await manager.findOne(Message, {
      where: { id: messageId },
      relations: ["recipients"],
    });

    if (!message) {
      throw new Error("Message not found");
    }

    return message;
  }

  // ─── Thread query helpers ─────────────────────────────────────────────────

  buildCursorPagination(
    qb: SelectQueryBuilder<Thread>,
    cursor?: string,
    limit = 20,
  ) {
    if (cursor) {
      qb.andWhere(
        "COALESCE(thread.lastMessageAt, thread.lastActivityAt) < :cursor",
        { cursor },
      );
    }
    return qb.take(limit);
  }

  async countDistinctThreads(baseQuery: SelectQueryBuilder<Thread>) {
    const totalResult = await baseQuery
      .clone()
      .select("COUNT(DISTINCT thread.id)", "count")
      .getRawOne<{ count: string }>();

    return Number(totalResult?.count ?? 0);
  }

  applyThreadRelations(qb: SelectQueryBuilder<Thread>, userId: string) {
    return qb
      .leftJoinAndSelect("thread.messages", "threadMessage")
      .leftJoin("threadMessage.sender", "threadMessageSender")
      .addSelect([
        "threadMessageSender.id",
        "threadMessageSender.email",
        "threadMessageSender.firstName",
        "threadMessageSender.lastName",
        "threadMessageSender.role",
        "threadMessageSender.avatarUrl",
      ])
      .leftJoinAndSelect("threadMessage.recipients", "threadMessageRecipient")
      .leftJoin(
        "threadMessageRecipient.recipient",
        "threadMessageRecipientUser",
      )
      .addSelect([
        "threadMessageRecipientUser.id",
        "threadMessageRecipientUser.email",
        "threadMessageRecipientUser.firstName",
        "threadMessageRecipientUser.lastName",
        "threadMessageRecipientUser.avatarUrl",
      ])
      .leftJoinAndSelect(
        "thread.userStates",
        "threadUserState",
        "threadUserState.userId = :userId",
        { userId },
      );
  }

  getInboxBaseQuery(userId: string) {
    return this.threadRepo
      .createQueryBuilder("thread")
      .innerJoin(
        "thread.messages",
        "filterMessage",
        "filterMessage.isDraft = false",
      )
      .innerJoin(
        "filterMessage.recipients",
        "filterRecipient",
        "filterRecipient.recipientId = :userId AND filterRecipient.isDeleted = false",
        { userId },
      );
  }

  getSentBaseQuery(userId: string) {
    return this.threadRepo
      .createQueryBuilder("thread")
      .innerJoin(
        "thread.messages",
        "filterMessage",
        "filterMessage.senderId = :userId AND filterMessage.isDraft = false AND filterMessage.senderDeletedAt IS NULL",
        { userId },
      );
  }

  getTrashBaseQuery(userId: string) {
    return this.threadRepo
      .createQueryBuilder("thread")
      .innerJoin("thread.messages", "filterMessage")
      .leftJoin(
        "filterMessage.recipients",
        "filterRecipient",
        "filterRecipient.recipientId = :userId",
        { userId },
      )
      .where(
        new Brackets((qb) => {
          qb.where(
            "filterMessage.senderId = :userId AND filterMessage.senderDeletedAt IS NOT NULL",
            { userId },
          ).orWhere(
            "filterRecipient.recipientId = :userId AND filterRecipient.isDeleted = true",
            { userId },
          );
        }),
      );
  }

  getStarredBaseQuery(userId: string) {
    return this.threadRepo
      .createQueryBuilder("thread")
      .innerJoin(
        "thread.messages",
        "filterMessage",
        "filterMessage.isDraft = false",
      )
      .innerJoin(
        "filterMessage.recipients",
        "filterRecipient",
        "filterRecipient.recipientId = :userId AND filterRecipient.isDeleted = false AND filterRecipient.isStarred = true",
        { userId },
      );
  }
}
