import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Brackets } from "typeorm";
import { MailQueryDto } from "./dto/mail-query.dto";
import { DraftMapper } from "./mappers/draft.mapper";
import { InboxMapper } from "./mappers/inbox.mapper";
import { MailMapper } from "./mappers/mail.mapper";
import { SentMapper } from "./mappers/sent.mapper";
import { MailCoreService, ThreadFolder } from "./mail-core.service";
import { UsersService } from "@modules/users/users.service";
import { forwardRef, Inject } from "@nestjs/common";

@Injectable()
export class MailboxService {
  constructor(
    private readonly core: MailCoreService,
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
  ) {}

  // ─── Folder resolution ────────────────────────────────────────────────────

  private async resolveUserId(userIdentifier: string) {
    if (this.core.isUuid(userIdentifier)) return userIdentifier;
    const user = await this.userService.findByEmail(userIdentifier);
    if (!user) throw new NotFoundException("User not found");
    return user.id;
  }

  // ─── Mailbox response builder ─────────────────────────────────────────────

  private prepareThreads(
    threads: any[],
    userId: string,
    mode: "visible" | "starred" | "trash" = "visible",
  ) {
    return threads
      .map((thread) => {
        const messages = (thread.messages ?? [])
          .filter((message: any) =>
            mode === "trash"
              ? this.core.isMessageInTrashForUser(message, userId)
              : mode === "starred"
                ? this.core.isMessageStarredForUser(message, userId)
                : this.core.isMessageVisibleToUser(message, userId),
          )
          .sort((left: any, right: any) =>
            this.core.compareMessages(left, right),
          );

        thread.messages = messages;
        thread.userState = MailMapper.getUserState(thread, userId);
        return thread;
      })
      .filter((thread) => thread.messages.length > 0);
  }

  private async buildMailboxResponse(
    baseQuery: any,
    userId: string,
    page: number,
    limit: number,
    folder: ThreadFolder,
  ) {
    const dataQb = this.core
      .applyThreadRelations(baseQuery.clone(), userId)
      .addSelect(
        "COALESCE(thread.lastMessageAt, thread.lastActivityAt)",
        "thread_sort_date",
      )
      .distinct(true)
      .setParameter("userId", userId)
      .orderBy("thread_sort_date", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [total, rows] = await Promise.all([
      this.core.countDistinctThreads(baseQuery),
      dataQb.getMany(),
    ]);

    const threads = this.prepareThreads(
      rows,
      userId,
      folder === "trash"
        ? "trash"
        : folder === "starred"
          ? "starred"
          : "visible",
    );

    const data =
      folder === "sent"
        ? SentMapper.toResponse(threads, userId)
        : InboxMapper.toResponse(threads, userId);

    return {
      data,
      total,
      page,
      lastPage: total === 0 ? 1 : Math.ceil(total / limit),
    };
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  async getFolder(userIdentifier: string, folder: string, query: MailQueryDto) {
    try {
      const userId = await this.resolveUserId(userIdentifier);
      const { page, limit } = this.core.normalizePagination(query);

      switch (folder) {
        case "inbox":
          return this.buildMailboxResponse(
            this.core.getInboxBaseQuery(userId),
            userId,
            page,
            limit,
            "inbox",
          );
        case "sent":
          return this.buildMailboxResponse(
            this.core.getSentBaseQuery(userId),
            userId,
            page,
            limit,
            "sent",
          );
        case "drafts":
          return this.getDrafts(userId, query);
        case "starred":
          return this.buildMailboxResponse(
            this.core.getStarredBaseQuery(userId),
            userId,
            page,
            limit,
            "starred",
          );
        case "trash":
          return this.buildMailboxResponse(
            this.core.getTrashBaseQuery(userId),
            userId,
            page,
            limit,
            "trash",
          );
        default:
          throw new BadRequestException("Unknown folder");
      }
    } catch (error) {
      this.core.handleError("MailboxService.getFolder", error);
    }
  }

  async getInbox(userId: string, cursor?: string) {
    const threads = await this.getInboxThreadsOptimized(userId, cursor);
    const mappedThreads = InboxMapper.toResponse(threads ?? [], userId);
    const nextCursor =
      threads && threads.length > 0
        ? (threads[threads.length - 1].lastMessageAt ??
          threads[threads.length - 1].lastActivityAt)
        : null;

    return { threads: mappedThreads, nextCursor };
  }

  async getSent(userEmail: string, query: MailQueryDto) {
    try {
      const userId = await this.resolveUserId(userEmail);
      return this.getFolder(userId, "sent", query);
    } catch (error) {
      this.core.handleError("MailboxService.getSent", error);
    }
  }

  async getTrash(userId: string, query: MailQueryDto) {
    try {
      const normalizedUserId = await this.resolveUserId(userId);
      const { page, limit } = this.core.normalizePagination(query);
      return this.buildMailboxResponse(
        this.core.getTrashBaseQuery(normalizedUserId),
        normalizedUserId,
        page,
        limit,
        "trash",
      );
    } catch (error) {
      this.core.handleError("MailboxService.getTrash", error);
    }
  }

  async getDrafts(userId: string, query: MailQueryDto) {
    try {
      const { page, limit } = this.core.normalizePagination(query);

      const [data, total] = await this.core.messageRepo.findAndCount({
        where: { senderId: userId, isDraft: true, senderDeletedAt: null },
        relations: {
          thread: true,
          sender: true,
          recipients: { recipient: true },
          attachments: true,
        },
        order: { createdAt: "DESC" },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: DraftMapper.toResponse(data, userId),
        total,
        page,
        lastPage: total === 0 ? 1 : Math.ceil(total / limit),
      };
    } catch (error) {
      this.core.handleError("MailboxService.getDrafts", error);
    }
  }

  async getThread(threadId: string, userId: string) {
    try {
      const visibleMessages = await this.getVisibleThreadMessages(
        threadId,
        userId,
      );
      return {
        data: MailMapper.toThreadDetail(threadId, visibleMessages, userId),
      };
    } catch (error) {
      this.core.handleError("MailboxService.getThread", error);
    }
  }

  async getMessageById(messageId: string, userId: string) {
    const message = await this.core.messageRepo.findOne({
      where: [
        { id: messageId, senderId: userId },
        { id: messageId, recipients: { recipientId: userId } },
      ],
      relations: {
        thread: true,
        sender: true,
        recipients: { recipient: true },
        attachments: true,
      },
    });

    if (!message)
      throw new NotFoundException("Message not found in recipient mailbox");

    return { data: MailMapper.toMessage(message, userId) };
  }

  async searchUserMail(userId: string, query: string, limit = 10) {
    try {
      return await this.core.messageRepo
        .createQueryBuilder("message")
        .leftJoin("message.recipients", "recipient")
        .where("message.isDraft = false")
        .andWhere(
          new Brackets((qb) => {
            qb.where("message.senderId = :userId", { userId }).orWhere(
              "recipient.recipientId = :userId",
              { userId },
            );
          }),
        )
        .andWhere(
          new Brackets((qb) => {
            qb.where("message.subject ILIKE :query", {
              query: `%${query}%`,
            }).orWhere("message.body ILIKE :query", { query: `%${query}%` });
          }),
        )
        .distinct(true)
        .orderBy("message.sentAt", "DESC")
        .take(limit)
        .getMany();
    } catch (error) {
      this.core.handleError("MailboxService.searchUserMail", error);
    }
  }

  async searchUserMailEs(userId: string, query: string, limit = 10) {
    return this.searchUserMail(userId, query, limit);
  }

  async getInboxThreadsOptimized(userId: string, cursor?: string, limit = 20) {
    try {
      const qb = this.core
        .applyThreadRelations(this.core.getInboxBaseQuery(userId), userId)
        .distinct(true)
        .addSelect(
          "COALESCE(thread.lastMessageAt, thread.lastActivityAt)",
          "thread_activity",
        )
        .orderBy("thread_activity", "DESC");

      this.core.buildCursorPagination(qb, cursor, limit);
      const threads = await qb.getMany();
      return this.prepareThreads(threads, userId);
    } catch (error) {
      this.core.handleError("MailboxService.getInboxThreadsOptimized", error);
    }
  }

  async getSentThreadsOptimized(userId: string, cursor?: string, limit = 20) {
    try {
      const qb = this.core
        .applyThreadRelations(this.core.getSentBaseQuery(userId), userId)
        .distinct(true)
        .orderBy(
          "COALESCE(thread.lastMessageAt, thread.lastActivityAt)",
          "DESC",
        );

      this.core.buildCursorPagination(qb, cursor, limit);
      const threads = await qb.getMany();
      return this.prepareThreads(threads, userId);
    } catch (error) {
      this.core.handleError("MailboxService.getSentThreadsOptimized", error);
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  async getVisibleThreadMessages(threadId: string, userId: string) {
    let messages = await this.core.messageRepo
      .createQueryBuilder("message")
      .leftJoinAndSelect("message.sender", "sender")
      .leftJoinAndSelect("message.recipients", "recipient")
      .leftJoinAndSelect("recipient.recipient", "recipientUser")
      .leftJoinAndSelect("message.attachments", "attachment")
      .leftJoin(
        "message.recipients",
        "accessRecipient",
        "accessRecipient.recipientId = :userId AND accessRecipient.isDeleted = false",
        { userId },
      )
      .where("message.threadId = :threadId", { threadId })
      .andWhere("message.isDraft = false")
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            "message.senderId = :userId AND message.senderDeletedAt IS NULL",
            { userId },
          ).orWhere("accessRecipient.id IS NOT NULL");
        }),
      )
      .orderBy("message.createdAt", "ASC")
      .getMany();

    if (!messages.length) {
      messages = await this.core.messageRepo
        .createQueryBuilder("message")
        .leftJoinAndSelect("message.sender", "sender")
        .leftJoinAndSelect("message.recipients", "recipient")
        .leftJoinAndSelect("recipient.recipient", "recipientUser")
        .leftJoinAndSelect("message.attachments", "attachment")
        .where("message.threadId = :threadId", { threadId })
        .andWhere("message.isDraft = false")
        .andWhere(
          new Brackets((qb) => {
            qb.where(
              "message.senderId = :userId AND message.senderDeletedAt IS NOT NULL",
              { userId },
            ).orWhere(
              "recipient.recipientId = :userId AND recipient.isDeleted = true",
              { userId },
            );
          }),
        )
        .orderBy("message.createdAt", "ASC")
        .getMany();
    }

    if (!messages.length) {
      throw new ForbiddenException("You do not have access to this thread");
    }

    return messages;
  }
}
