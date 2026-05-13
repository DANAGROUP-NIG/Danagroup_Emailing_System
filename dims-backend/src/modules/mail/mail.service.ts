import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Brackets,
  DataSource,
  EntityManager,
  In,
  IsNull,
  Repository,
  SelectQueryBuilder,
} from "typeorm";
import { Attachment } from "../files/entities/attachment.entity";
import { User } from "../users/entities/user.entity";
import { MailQueryDto } from "./dto/mail-query.dto";
import { SaveDraftDto } from "./dto/save-draft.dto";
import { SendMailDto } from "./dto/send-mail.dto";
import { SendMailResponseDto } from "./dto/response/send-mail.response.dto";
import {
  MessageRecipient,
  RecipientType,
} from "./entities/message-recipient.entity";
import { Message } from "./entities/message.entity";
import { Thread } from "./entities/thread.entity";
import { UserThreadState } from "./entities/UserThreadState.entity";
import { JobsService } from "@jobs/jobs.service";
import { UsersService } from "@modules/users/users.service";
import { DraftMapper } from "./mappers/draft.mapper";
import { InboxMapper } from "./mappers/inbox.mapper";
import { MailMapper } from "./mappers/mail.mapper";
import { MailboxChangedPayload, MailGateway } from "./mail.gateway";
import { SentMapper } from "./mappers/sent.mapper";
import DOMPurify from "isomorphic-dompurify";

type MailboxResponse<T> = {
  data: T[];
  total: number;
  page: number;
  lastPage: number;
};

type RecipientInput = {
  recipientId: string;
  type: RecipientType;
};

type ThreadFolder = "inbox" | "sent" | "starred" | "trash";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Thread)
    private readonly threadRepo: Repository<Thread>,
    @InjectRepository(MessageRecipient)
    private readonly recipientRepo: Repository<MessageRecipient>,
    @InjectRepository(UserThreadState)
    private readonly userThreadStateRepo: Repository<UserThreadState>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Attachment)
    private readonly attachmentRepo: Repository<Attachment>,
    private readonly jobsService: JobsService,
    private readonly mailGateway: MailGateway,
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
  ) {}

  private handleError(method: string, error: any) {
    // Do not mask NestJS known exceptions (BadRequestException, etc.)
    console.error(`MailService.${method} failed:`, {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }

  private normalizePagination(query: MailQueryDto) {
    return {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
  }

  private emitMailboxChanged(userId: string, payload: MailboxChangedPayload) {
    this.mailGateway.emitMailboxChanged(userId, payload);
  }

  private uniqueFolders(folders: string[]) {
    return [...new Set(folders)];
  }

  private getUserMailboxFoldersForMessage(message: Message, userId: string) {
    const folders: string[] = [];

    if (message.senderId === userId) {
      folders.push(message.senderDeletedAt ? "trash" : "sent");
    }

    const recipient = message.recipients?.find(
      (item) => item.recipientId === userId,
    );

    if (recipient) {
      folders.push(recipient.isDeleted ? "trash" : "inbox");

      if (recipient.isStarred) {
        folders.push("starred");
      }
    }

    return this.uniqueFolders(folders);
  }

  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  private async resolveUserId(userIdentifier: string) {
    if (this.isUuid(userIdentifier)) {
      return userIdentifier;
    }

    const user = await this.userService.findByEmail(userIdentifier);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user.id;
  }

  private buildCursorPagination(
    qb: SelectQueryBuilder<Thread>,
    cursor?: string,
    limit = 20,
  ) {
    if (cursor) {
      qb.andWhere(
        "COALESCE(thread.last_message_at, thread.last_activity_at) < :cursor",
        { cursor },
      );
    }

    return qb.take(limit);
  }

  private async countDistinctThreads(baseQuery: SelectQueryBuilder<Thread>) {
    const totalResult = await baseQuery
      .clone()
      .select("COUNT(DISTINCT thread.id)", "count")
      .getRawOne<{ count: string }>();

    return Number(totalResult?.count ?? 0);
  }

  private applyThreadRelations(qb: SelectQueryBuilder<Thread>, userId: string) {
    return (
      qb
        .leftJoinAndSelect("thread.messages", "threadMessage")
        // 1. Use leftJoin instead of leftJoinAndSelect for the sender
        .leftJoin("threadMessage.sender", "threadMessageSender")
        // 2. Explicitly select only the columns you need (excluding 'sessions')
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
        )
    );
  }

  private compareMessages(
    left: Message,
    right: Message,
    direction: "ASC" | "DESC" = "DESC",
  ) {
    const leftDate = left.sentAt ?? left.createdAt;
    const rightDate = right.sentAt ?? right.createdAt;
    const diff = leftDate.getTime() - rightDate.getTime();
    return direction === "ASC" ? diff : -diff;
  }

  private prepareThreads(
    threads: Thread[],
    userId: string,
    mode: "visible" | "starred" | "trash" = "visible",
  ) {
    return threads
      .map((thread) => {
        const messages = (thread.messages ?? [])
          .filter((message) =>
            mode === "trash"
              ? this.isMessageInTrashForUser(message, userId)
              : mode === "starred"
                ? this.isMessageStarredForUser(message, userId)
                : this.isMessageVisibleToUser(message, userId),
          )
          .sort((left, right) => this.compareMessages(left, right));

        thread.messages = messages;
        (thread as Thread & { userState?: UserThreadState | null }).userState =
          MailMapper.getUserState(thread, userId);

        return thread;
      })
      .filter((thread) => thread.messages.length > 0);
  }

  private async buildMailboxResponse(
    baseQuery: SelectQueryBuilder<Thread>,
    userId: string,
    page: number,
    limit: number,
    folder: ThreadFolder,
  ) {
    const total = await this.countDistinctThreads(baseQuery);

    // Use the clone to avoid polluting the baseQuery logic
    const qb = this.applyThreadRelations(baseQuery.clone(), userId);
    const rows = await qb
      .addSelect(
        "COALESCE(thread.last_message_at, thread.last_activity_at)",
        "thread_sort_date",
      )
      .distinct(true)
      .setParameter("userId", userId)
      .orderBy("thread_sort_date", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

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
      folder === "inbox"
        ? InboxMapper.toResponse(threads, userId)
        : folder === "sent"
          ? SentMapper.toResponse(threads, userId)
          : folder === "starred"
            ? InboxMapper.toResponse(threads, userId)
            : InboxMapper.toResponse(threads, userId);

    return {
      data,
      total,
      page,
      lastPage: total === 0 ? 1 : Math.ceil(total / limit),
    };
  }

  private getInboxBaseQuery(userId: string) {
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

  private getSentBaseQuery(userId: string) {
    return this.threadRepo
      .createQueryBuilder("thread")
      .innerJoin(
        "thread.messages",
        "filterMessage",
        "filterMessage.senderId = :userId AND filterMessage.isDraft = false AND filterMessage.senderDeletedAt IS NULL",
        { userId },
      );
  }

  private getTrashBaseQuery(userId: string) {
    return this.threadRepo
      .createQueryBuilder("thread")
      .innerJoin(
        "thread.messages",
        "filterMessage",
        "filterMessage.isDraft = false",
      )
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

  private getStarredBaseQuery(userId: string) {
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

  private async getThreadsByMailbox(
    type: "inbox" | "sent",
    userId: string,
    cursor?: string,
  ) {
    switch (type) {
      case "inbox":
        return this.getInboxThreadsOptimized(userId, cursor);
      case "sent":
        return this.getSentThreadsOptimized(userId, cursor);
    }
  }

  async searchUserMail(userId: string, query: string, limit = 10) {
    try {
      return await this.messageRepo
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
            }).orWhere("message.body ILIKE :query", {
              query: `%${query}%`,
            });
          }),
        )
        .distinct(true)
        .orderBy("message.sentAt", "DESC")
        .take(limit)
        .getMany();
    } catch (error) {
      this.handleError("searchUserMail", error);
    }
  }

  async getInboxThreadsOptimized(userId: string, cursor?: string, limit = 20) {
    try {
      const qb = this.applyThreadRelations(
        this.getInboxBaseQuery(userId),
        userId,
      )
        .distinct(true)
        .addSelect(
          "COALESCE(thread.lastMessageAt, thread.lastActivityAt)",
          "thread_activity",
        )
        .orderBy("thread_activity", "DESC");

      this.buildCursorPagination(qb, cursor, limit);

      const threads = await qb.getMany();
      return this.prepareThreads(threads, userId);
    } catch (error) {
      this.handleError("getInboxThreadsOptimized", error);
    }
  }

  async getSentThreadsOptimized(userId: string, cursor?: string, limit = 20) {
    try {
      const qb = this.applyThreadRelations(
        this.getSentBaseQuery(userId),
        userId,
      )
        .distinct(true)
        .orderBy(
          "COALESCE(thread.lastMessageAt, thread.lastActivityAt)",
          "DESC",
        );

      this.buildCursorPagination(qb, cursor, limit);

      const threads = await qb.getMany();
      return this.prepareThreads(threads, userId);
    } catch (error) {
      this.handleError("getSentThreadsOptimized", error);
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
      this.handleError("getSent", error);
    }
  }

  async getDrafts(
    userId: string,
    query: MailQueryDto,
  ): Promise<MailboxResponse<any>> {
    try {
      const { page, limit } = this.normalizePagination(query);

      const [data, total] = await this.messageRepo.findAndCount({
        where: {
          senderId: userId,
          isDraft: true,
          senderDeletedAt: IsNull(),
        },
        relations: {
          thread: true,
          sender: true,
          recipients: {
            recipient: true,
          },
          attachments: true,
        },
        order: {
          createdAt: "DESC",
        },
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
      this.handleError("getDrafts", error);
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
      this.handleError("getThread", error);
    }
  }

  async getFolder(userIdentifier: string, folder: string, query: MailQueryDto) {
    try {
      const userId = await this.resolveUserId(userIdentifier);
      const { page, limit } = this.normalizePagination(query);

      switch (folder) {
        case "inbox":
          return this.buildMailboxResponse(
            this.getInboxBaseQuery(userId),
            userId,
            page,
            limit,
            "inbox",
          );
        case "sent":
          return this.buildMailboxResponse(
            this.getSentBaseQuery(userId),
            userId,
            page,
            limit,
            "sent",
          );
        case "drafts":
          return this.getDrafts(userId, query);
        case "starred":
          return this.buildMailboxResponse(
            this.getStarredBaseQuery(userId),
            userId,
            page,
            limit,
            "starred",
          );
        case "trash":
          return this.buildMailboxResponse(
            this.getTrashBaseQuery(userId),
            userId,
            page,
            limit,
            "trash",
          );
        default:
          throw new BadRequestException("Unknown folder");
      }
    } catch (error) {
      this.handleError("getFolder", error);
    }
  }

  async send(
    dto: SendMailDto,
    senderEmail: string,
  ): Promise<SendMailResponseDto> {
    try {
      const sender = await this.userService.findByEmail(senderEmail);
      if (!sender) {
        throw new NotFoundException("Sender not found");
      }

      const result = await this.dataSource.transaction(async (manager) => {
        const recipients = await this.buildRecipientInputs(dto, true);
        if (!recipients.length) {
          throw new BadRequestException(
            "No valid recipients were resolved for this message",
          );
        }

        const subject = dto.subject?.trim() ?? "";
        const thread = await this.resolveThread(
          manager,
          dto.threadId,
          subject,
          sender.id,
        );
        const sentAt = new Date();

        let message: Message;
        if (dto.draftId) {
          message = await this.findOwnedDraft(manager, dto.draftId, sender.id);
          message.threadId = thread.id;
          message.subject = dto.subject ?? message.subject;
          message.body = dto.body;
          message.bodyHtml =
            this.sanitizeBodyHtml(dto.bodyHtml) ?? this.buildBodyHtml(dto.body);
          message.isDraft = false;
          message.sentAt = sentAt;
          message.senderDeletedAt = null;
        } else {
          message = manager.create(Message, {
            threadId: thread.id,
            senderId: sender.id,
            subject,
            body: dto.body,
            bodyHtml:
              this.sanitizeBodyHtml(dto.bodyHtml) ??
              this.buildBodyHtml(dto.body),
            isDraft: false,
            sentAt,
          });
        }

        const saved = await manager.save(message);

        await this.replaceRecipients(manager, saved.id, recipients);

        await this.replaceAttachments(
          manager,
          saved.id,
          sender.id,
          dto.attachmentIds ?? [],
        );

        if (subject) {
          await this.updateThreadSubject(manager, thread, subject);
        }

        await this.refreshThreadAfterMutation(manager, thread.id, subject);

        return {
          id: saved.id,
          threadId: thread.id,
          sentAt,
          recipientIds: recipients.map((recipient) => recipient.recipientId),
        };
      });

      await Promise.all([
        this.jobsService.enqueueMailDelivery({ messageId: result.id }),
        this.jobsService.enqueueMessageIndex({ messageId: result.id }),
      ]);

      const response = MailMapper.toSendMailResponse(result);

      this.emitMailboxChanged(sender.id, {
        action: "message_sent",
        messageId: response.messageId,
        threadId: response.threadId,
        folders: dto.draftId ? ["sent", "drafts"] : ["sent"],
      });
      for (const recipientId of result.recipientIds) {
        this.emitMailboxChanged(recipientId, {
          action: "message_received",
          messageId: response.messageId,
          threadId: response.threadId,
          folders: ["inbox"],
        });
      }

      return {
        messageId: response.messageId,
        threadId: response.threadId,
        sentAt: response.sentAt,
        status: response.status,
      };
    } catch (error) {
      this.handleError("send", error);
    }
  }

  async saveDraft(dto: SaveDraftDto, senderId: string) {
    try {
      const draft = await this.dataSource.transaction(async (manager) => {
        const subject = dto.subject?.trim() ?? "";
        const thread = await this.resolveThread(
          manager,
          dto.threadId,
          subject,
          senderId,
        );

        let draft: Message;
        if (dto.draftId) {
          draft = await this.findOwnedDraft(manager, dto.draftId, senderId);
          draft.threadId = thread.id;
          draft.subject = dto.subject ?? draft.subject;
          draft.body = dto.body ?? draft.body ?? "";
          draft.bodyHtml = this.sanitizeBodyHtml(
            dto.bodyHtml ?? this.buildBodyHtml(draft.body),
          );
          draft.isDraft = true;
          draft.sentAt = null;
          draft.senderDeletedAt = null;
        } else {
          const generatedHtml = dto.body
            ? `<p>${dto.body.replace(/\n/g, "<br>")}</p>`
            : null;

          draft = manager.create(Message, {
            threadId: thread.id,
            senderId,
            subject,
            body: dto.body ?? "",
            bodyHtml: dto.bodyHtml
              ? this.sanitizeBodyHtml(dto.bodyHtml)
              : generatedHtml,
            isDraft: true,
            sentAt: null,
          });
        }

        const savedDraft = await manager.save(draft);

        if (this.includesRecipientUpdate(dto)) {
          const recipients = await this.buildRecipientInputs(dto, false);
          await this.replaceRecipients(manager, savedDraft.id, recipients);
        }

        if (Object.prototype.hasOwnProperty.call(dto, "attachmentIds")) {
          await this.replaceAttachments(
            manager,
            savedDraft.id,
            senderId,
            dto.attachmentIds ?? [],
          );
        }

        if (subject) {
          await this.updateThreadSubject(manager, thread, subject);
        }

        await this.refreshThreadMetadata(manager, thread.id, subject);
        return await this.getMessageOrFail(manager, savedDraft.id);
      });

      this.emitMailboxChanged(senderId, {
        action: "draft_saved",
        messageId: draft.id,
        threadId: draft.threadId,
        folders: ["drafts"],
      });

      return draft;
    } catch (error) {
      this.handleError("saveDraft", error);
    }
  }

  async getMessageById(messageId: string, userId: string) {
    const message = await this.messageRepo.findOne({
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

    if (!message) {
      throw new NotFoundException("Message not found in recipient mailbox");
    }

    return {
      data: MailMapper.toMessage(message, userId),
    };
  }

  async readMessage(messageId: string, userId: string) {
    try {
      if (!userId) {
        throw new BadRequestException("User ID is required");
      }

      const message = await this.messageRepo
        .createQueryBuilder("message")
        .leftJoinAndSelect("message.sender", "sender")
        .leftJoinAndSelect("message.attachments", "attachments")
        .leftJoinAndSelect(
          "message.recipients",
          "recipient",
          "recipient.recipientId = :userId AND recipient.isDeleted = false",
          { userId },
        )
        .leftJoinAndSelect("recipient.recipient", "recipientUser")
        .where("message.id = :messageId", { messageId })
        .andWhere("(message.senderId = :userId OR recipient.id IS NOT NULL)", {
          userId,
        })
        .getOne();

      if (!message) {
        throw new NotFoundException("Message not found");
      }

      const isRecipient = message.recipients.some(
        (recipient) => recipient.recipientId === userId,
      );
      const isSender = message.senderId === userId;

      if (!isRecipient && !isSender) {
        throw new ForbiddenException("Access denied");
      }

      await this.markRead(messageId, userId, true);

      return {
        data: MailMapper.toMessage(message, userId),
      };
    } catch (error) {
      this.handleError("readMessage", error);
    }
  }

  async markRead(messageId: string, userId: string, isRead = true) {
    try {
      const message = await this.messageRepo.findOne({
        where: { id: messageId },
      });

      if (!message) {
        throw new NotFoundException("Message not found");
      }

      if (message.senderId === userId) {
        return { success: true };
      }

      if (message.isDraft) {
        return {
          data: { messageId, isRead: false, readAt: null },
        };
      }

      const recipient = await this.recipientRepo.findOne({
        where: {
          messageId,
          recipientId: userId,
        },
      });

      if (!recipient) {
        throw new NotFoundException("Message not found in recipient mailbox");
      }

      if (recipient.isRead === isRead) {
        return {
          data: {
            messageId,
            isRead: recipient.isRead,
            readAt: recipient.readAt,
          },
        };
      }

      recipient.isRead = isRead;
      recipient.readAt = isRead ? new Date() : null;
      await this.recipientRepo.save(recipient);
      await this.refreshUserThreadState(
        this.dataSource.manager,
        message.threadId,
        userId,
      );
      this.emitMailReadEvent(
        userId,
        messageId,
        message.threadId,
        recipient.readAt,
      );
      this.emitMailboxChanged(userId, {
        action: "read_state_changed",
        messageId,
        threadId: message.threadId,
        folders: recipient.isStarred ? ["inbox", "starred"] : ["inbox"],
      });

      return {
        data: {
          messageId,
          isRead: recipient.isRead,
          readAt: recipient.readAt,
        },
      };
    } catch (error) {
      this.handleError("markRead", error);
    }
  }

  async markManyAsRead(messageIds: string[], userId: string) {
    try {
      if (!messageIds.length) {
        return {
          data: {
            messageIds,
            isRead: true,
          },
        };
      }

      await this.recipientRepo
        .createQueryBuilder()
        .update()
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where("recipientId = :userId", { userId })
        .andWhere("messageId IN (:...messageIds)", { messageIds })
        .execute();

      const messages = await this.messageRepo.find({
        where: { id: In(messageIds) },
        select: ["id", "threadId"],
      });

      for (const threadId of [
        ...new Set(messages.map((message) => message.threadId)),
      ]) {
        await this.refreshUserThreadState(
          this.dataSource.manager,
          threadId,
          userId,
        );
      }

      for (const message of messages) {
        this.emitMailReadEvent(
          userId,
          message.id,
          message.threadId,
          new Date(),
        );
      }

      this.emitMailboxChanged(userId, {
        action: "read_state_changed",
        messageIds,
        threadIds: [...new Set(messages.map((message) => message.threadId))],
        folders: ["inbox", "starred"],
      });

      return {
        data: {
          messageIds,
          isRead: true,
        },
      };
    } catch (error) {
      this.handleError("markManyAsRead", error);
    }
  }

  async markThreadAsRead(threadId: string, userId: string) {
    try {
      await this.recipientRepo
        .createQueryBuilder()
        .update()
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where("recipientId = :userId", { userId })
        .andWhere(
          "messageId IN (" +
            this.messageRepo
              .createQueryBuilder("msg")
              .select("msg.id")
              .where("msg.threadId = :threadId")
              .getQuery() +
            ")",
          { threadId },
        )
        .execute();

      await this.refreshUserThreadState(
        this.dataSource.manager,
        threadId,
        userId,
      );
      this.mailGateway.emitMailRead(userId, {
        threadId,
        isRead: true,
        readAt: new Date().toISOString(),
      });
      this.emitMailboxChanged(userId, {
        action: "read_state_changed",
        threadId,
        folders: ["inbox", "starred"],
      });

      return {
        data: {
          threadId,
          isRead: true,
        },
      };
    } catch (error) {
      this.handleError("markThreadAsRead", error);
    }
  }

  async readThread(threadId: string, userId: string) {
    try {
      await this.markThreadAsRead(threadId, userId);
      const visibleMessages = await this.getVisibleThreadMessages(
        threadId,
        userId,
      );

      return {
        data: MailMapper.toThreadDetail(threadId, visibleMessages, userId),
      };
    } catch (error) {
      this.handleError("readThread", error);
    }
  }

  async toggleStar(messageId: string, userId: string, isStarred?: boolean) {
    try {
      const recipient = await this.recipientRepo.findOne({
        where: {
          messageId,
          recipientId: userId,
        },
      });

      if (!recipient) {
        throw new NotFoundException("Message not found in recipient mailbox");
      }

      recipient.isStarred = isStarred ?? !recipient.isStarred;
      await this.recipientRepo.save(recipient);

      const message = await this.messageRepo.findOne({
        where: { id: messageId },
        select: ["threadId"],
      });

      if (message) {
        await this.refreshUserThreadState(
          this.dataSource.manager,
          message.threadId,
          userId,
        );
        this.emitMailboxChanged(userId, {
          action: "star_state_changed",
          messageId,
          threadId: message.threadId,
          folders: recipient.isDeleted
            ? ["trash", "starred"]
            : ["inbox", "starred"],
        });
      }

      return {
        data: {
          messageId,
          isStarred: recipient.isStarred,
        },
      };
    } catch (error) {
      this.handleError("toggleStar", error);
    }
  }

  async moveToTrash(messageId: string, userId: string) {
    try {
      const message = await this.messageRepo.findOne({
        where: { id: messageId },
        relations: {
          recipients: true,
        },
      });

      if (!message) {
        throw new NotFoundException("Message not found");
      }

      if (message.isDraft) {
        if (message.senderId !== userId) {
          throw new ForbiddenException("No access to this draft");
        }

        const threadId = message.threadId;
        await this.messageRepo.delete(messageId);
        await this.refreshThreadAfterMutation(this.dataSource.manager, threadId);
        await this.jobsService.enqueueMessageDelete({ messageId });
        this.emitMailboxChanged(userId, {
          action: "permanently_deleted",
          messageId,
          threadId,
          folders: ["drafts"],
        });

        return {
          data: {
            messageId,
            status: "draft_deleted",
          },
        };
      }

      const previousFolders = this.getUserMailboxFoldersForMessage(
        message,
        userId,
      );
      let changed = false;
      const now = new Date();

      if (message.senderId === userId) {
        message.senderDeletedAt = now;
        await this.messageRepo.save(message);
        changed = true;
      }

      const recipient = message.recipients.find(
        (item) => item.recipientId === userId,
      );
      if (recipient) {
        recipient.isDeleted = true;
        recipient.deletedAt = now;
        await this.recipientRepo.save(recipient);
        changed = true;
      }

      if (!changed) {
        throw new ForbiddenException("No access to this message");
      }

      await this.refreshThreadAfterMutation(
        this.dataSource.manager,
        message.threadId,
      );
      await this.refreshUserThreadState(
        this.dataSource.manager,
        message.threadId,
        userId,
      );
      this.emitMailboxChanged(userId, {
        action: "moved_to_trash",
        messageId,
        threadId: message.threadId,
        folders: this.uniqueFolders([...previousFolders, "trash"]),
      });

      return {
        data: {
          messageId,
          status: "moved_to_trash",
        },
      };
    } catch (error) {
      this.handleError("moveToTrash", error);
    }
  }

  async getTrash(userId: string, query: MailQueryDto) {
    try {
      const normalizedUserId = await this.resolveUserId(userId);
      const { page, limit } = this.normalizePagination(query);
      return this.buildMailboxResponse(
        this.getTrashBaseQuery(normalizedUserId),
        normalizedUserId,
        page,
        limit,
        "trash",
      );
    } catch (error) {
      this.handleError("getTrash", error);
    }
  }

  async restoreFromTrash(messageId: string, userId: string) {
    try {
      let message = await this.messageRepo.findOne({
        where: { id: messageId },
        relations: { recipients: true },
      });

      if (!message) {
        throw new NotFoundException("Message not found");
      }

      if (!this.isMessageInTrashForUser(message, userId)) {
        const trashedThreadMessage = await this.messageRepo
          .createQueryBuilder("message")
          .leftJoinAndSelect("message.recipients", "recipient")
          .where("message.threadId = :threadId", {
            threadId: message.threadId,
          })
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
          .addSelect(
            "COALESCE(message.sentAt, message.createdAt)",
            "messageSortDate",
          )
          .orderBy("messageSortDate", "DESC")
          .getOne();

        if (trashedThreadMessage) {
          message = trashedThreadMessage;
          messageId = trashedThreadMessage.id;
        }
      }

      const previousFolders = this.getUserMailboxFoldersForMessage(
        message,
        userId,
      );
      let changed = false;

      if (message.senderId === userId && message.senderDeletedAt !== null) {
        message.senderDeletedAt = null;
        await this.messageRepo.save(message);
        changed = true;
      }

      const recipient = message.recipients.find(
        (item) => item.recipientId === userId,
      );

      if (recipient && recipient.isDeleted) {
        recipient.isDeleted = false;
        recipient.deletedAt = null;
        await this.recipientRepo.save(recipient);
        changed = true;
      }

      if (!changed) {
        throw new BadRequestException(
          "Message is not in trash or you don't have access",
        );
      }

      await this.refreshThreadAfterMutation(
        this.dataSource.manager,
        message.threadId,
      );
      await this.refreshUserThreadState(
        this.dataSource.manager,
        message.threadId,
        userId,
      );
      this.emitMailboxChanged(userId, {
        action: "restored_from_trash",
        messageId,
        threadId: message.threadId,
        folders: this.uniqueFolders([
          ...previousFolders,
          ...this.getUserMailboxFoldersForMessage(message, userId),
        ]),
      });

      return {
        data: {
          messageId,
          restored: true,
        },
      };
    } catch (error) {
      this.handleError("restoreFromTrash", error);
    }
  }

  async permanentlyDelete(messageId: string, userId: string) {
    try {
      const message = await this.messageRepo.findOne({
        where: { id: messageId },
        relations: { recipients: true },
      });

      if (!message) {
        throw new NotFoundException("Message not found");
      }

      const previousFolders = this.getUserMailboxFoldersForMessage(
        message,
        userId,
      );

      if (message.senderId === userId && message.senderDeletedAt !== null) {
        const threadId = message.threadId;
        await this.messageRepo.delete(messageId);
        await this.refreshThreadAfterMutation(
          this.dataSource.manager,
          threadId,
        );
        await this.jobsService.enqueueMessageDelete({ messageId });
        this.emitMailboxChanged(userId, {
          action: "permanently_deleted",
          messageId,
          threadId,
          folders: this.uniqueFolders([...previousFolders, "trash"]),
        });
        return { messageId, status: "permanently_deleted_by_sender" };
      }

      const recipient = message.recipients.find(
        (currentRecipient) => currentRecipient.recipientId === userId,
      );
      if (recipient && recipient.isDeleted) {
        await this.recipientRepo.remove(recipient);
        await this.refreshThreadAfterMutation(
          this.dataSource.manager,
          message.threadId,
        );
        await this.refreshUserThreadState(
          this.dataSource.manager,
          message.threadId,
          userId,
        );
        this.emitMailboxChanged(userId, {
          action: "permanently_deleted",
          messageId,
          threadId: message.threadId,
          folders: this.uniqueFolders([...previousFolders, "trash"]),
        });
        return {
          data: {
            messageId,
            status: "permanently_deleted_by_recipient",
          },
        };
      }

      throw new BadRequestException(
        "Message must be in trash before permanent deletion",
      );
    } catch (error) {
      this.handleError("permanentlyDelete", error);
    }
  }

  async emptyAllTrash(userId: string) {
    try {
      const recipientRows = await this.recipientRepo.find({
        where: {
          recipientId: userId,
          isDeleted: true,
        },
      });

      const senderMessages = await this.messageRepo.find({
        where: {
          senderId: userId,
        },
        select: ["id", "threadId", "senderDeletedAt"],
      });

      const recipientMessages = recipientRows.length
        ? await this.messageRepo.find({
            where: {
              id: In(recipientRows.map((row) => row.messageId)),
            },
            select: ["id", "threadId"],
          })
        : [];

      const affectedThreadIds = [
        ...new Set(
          [
            ...recipientMessages.map((message) => message.threadId),
            ...senderMessages
              .filter((message) => !!message.senderDeletedAt)
              .map((message) => message.threadId),
          ].filter(Boolean),
        ),
      ];

      const result = await this.recipientRepo
        .createQueryBuilder()
        .delete()
        .where("recipientId = :userId", { userId })
        .andWhere("isDeleted = true")
        .execute();

      await this.messageRepo
        .createQueryBuilder()
        .delete()
        .where("senderId = :userId", { userId })
        .andWhere("senderDeletedAt IS NOT NULL")
        .execute();

      for (const message of senderMessages.filter(
        (item) => !!item.senderDeletedAt,
      )) {
        await this.jobsService.enqueueMessageDelete({ messageId: message.id });
      }

      for (const threadId of affectedThreadIds) {
        await this.refreshUserThreadState(
          this.dataSource.manager,
          threadId,
          userId,
        );
        await this.refreshThreadAfterMutation(
          this.dataSource.manager,
          threadId,
        );
      }

      this.emitMailboxChanged(userId, {
        action: "trash_emptied",
        threadIds: affectedThreadIds,
        folders: ["trash"],
      });

      return {
        data: {
          success: true,
          count: result.affected,
        },
      };
    } catch (error) {
      this.handleError("emptyAllTrash", error);
    }
  }

  async purgeExpiredTrash(olderThanDays = 30) {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - olderThanDays);

      const expiredRecipientRows = await this.recipientRepo
        .createQueryBuilder("recipient")
        .where("recipient.isDeleted = true")
        .andWhere("recipient.deletedAt IS NOT NULL")
        .andWhere("recipient.deletedAt <= :cutoff", { cutoff })
        .getMany();

      const senderMessages = await this.messageRepo
        .createQueryBuilder("message")
        .where("message.senderDeletedAt IS NOT NULL")
        .andWhere("message.senderDeletedAt <= :cutoff", { cutoff })
        .select(["message.id", "message.threadId", "message.senderId"])
        .getMany();

      const affectedThreadIds = new Set<string>();
      const affectedUserIds = new Set<string>();

      for (const row of expiredRecipientRows) {
        affectedUserIds.add(row.recipientId);
      }

      if (expiredRecipientRows.length > 0) {
        const recipientMessages = await this.messageRepo.find({
          where: {
            id: In(expiredRecipientRows.map((row) => row.messageId)),
          },
          select: ["id", "threadId"],
        });

        for (const message of recipientMessages) {
          affectedThreadIds.add(message.threadId);
        }

        await this.recipientRepo.delete(
          expiredRecipientRows.map((row) => row.id),
        );
      }

      for (const message of senderMessages) {
        affectedThreadIds.add(message.threadId);
        affectedUserIds.add(message.senderId);
      }

      if (senderMessages.length > 0) {
        await this.messageRepo.delete(
          senderMessages.map((message) => message.id),
        );

        for (const message of senderMessages) {
          await this.jobsService.enqueueMessageDelete({
            messageId: message.id,
          });
        }
      }

      for (const threadId of affectedThreadIds) {
        await this.refreshThreadAfterMutation(
          this.dataSource.manager,
          threadId,
        );
      }

      for (const userId of affectedUserIds) {
        const threadIds = [...affectedThreadIds];
        for (const threadId of threadIds) {
          await this.refreshUserThreadState(
            this.dataSource.manager,
            threadId,
            userId,
          );
        }
      }

      return {
        data: {
          success: true,
          recipientDeletes: expiredRecipientRows.length,
          senderDeletes: senderMessages.length,
          olderThanDays,
        },
      };
    } catch (error) {
      this.handleError("purgeExpiredTrash", error);
    }
  }

  private emitMailReadEvent(
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

  private buildBodyHtml(body: string) {
    return `<p>${body.replace(/\n/g, "<br>")}</p>`;
  }

  private sanitizeBodyHtml(bodyHtml?: string | null) {
    if (!bodyHtml) {
      return null;
    }

    return DOMPurify.sanitize(bodyHtml, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "b",
        "i",
        "strong",
        "em",
        "u",
        "a",
        "ul",
        "ol",
        "li",
        "blockquote",
      ],
      ALLOWED_ATTR: ["href", "target"],
    });
  }

  private async assertThreadAccess(
    manager: EntityManager,
    threadId: string,
    userId: string,
  ) {
    const accessibleCount = await manager
      .createQueryBuilder(Message, "message")
      .leftJoin(
        MessageRecipient,
        "recipient",
        "recipient.messageId = message.id AND recipient.recipientId = :userId",
        { userId },
      )
      .where("message.threadId = :threadId", { threadId })
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            "message.senderId = :userId AND message.senderDeletedAt IS NULL",
            { userId },
          ).orWhere(
            "recipient.recipientId = :userId AND recipient.isDeleted = false",
            { userId },
          );
        }),
      )
      .getCount();

    if (!accessibleCount) {
      throw new ForbiddenException("You do not have access to this thread");
    }
  }

  private async resolveThread(
    manager: EntityManager,
    threadId?: string,
    subject?: string,
    userId?: string,
  ): Promise<Thread> {
    if (threadId) {
      const thread = await manager.findOne(Thread, { where: { id: threadId } });
      if (!thread) {
        throw new NotFoundException("Thread not found");
      }

      if (userId) {
        await this.assertThreadAccess(manager, threadId, userId);
      }

      return thread;
    }

    const newThread = manager.create(Thread, {
      subject: subject?.toLowerCase().trim() || "No Subject",
      lastActivityAt: new Date(),
      lastMessageAt: new Date(),
    });

    return manager.save(newThread);
  }

  private async updateThreadSubject(
    manager: EntityManager,
    thread: Thread,
    subject: string,
  ) {
    if (!thread.subject || thread.subject === "No Subject") {
      thread.subject = subject;
      await manager.save(thread);
    }
  }

  private async buildRecipientInputs(
    dto: Partial<Pick<SendMailDto, "toEmails" | "ccEmails" | "bccEmails">> &
      Partial<Pick<SaveDraftDto, "toEmails" | "ccEmails" | "bccEmails">>,
    requireAtLeastOne: boolean,
  ): Promise<RecipientInput[]> {
    const rawRecipients = [
      ...(dto.toEmails ?? []).map((email) => ({
        email: email.toLowerCase().trim(),
        type: "to",
      })),
      ...(dto.ccEmails ?? []).map((email) => ({
        email: email.toLowerCase().trim(),
        type: "cc",
      })),
      ...(dto.bccEmails ?? []).map((email) => ({
        email: email.toLowerCase().trim(),
        type: "bcc",
      })),
    ];

    if (requireAtLeastOne && rawRecipients.length === 0) {
      throw new BadRequestException("At least one recipient is required");
    }

    if (!rawRecipients.length) {
      return [];
    }

    const distinctEmails = [
      ...new Set(rawRecipients.map((recipient) => recipient.email)),
    ];
    const users = await this.userRepo
      .createQueryBuilder("user")
      .select(["user.id", "user.email"])
      .where("LOWER(user.email) IN (:...emails)", { emails: distinctEmails })
      .andWhere("user.isActive = true")
      .getMany();

    if (users.length !== distinctEmails.length) {
      if (requireAtLeastOne) {
        throw new BadRequestException(
          "One or more recipient emails are invalid",
        );
      }

      this.logger.warn(
        "Some draft recipients not found in DB; skipping those entries.",
      );
    }

    const emailToIdMap = new Map(
      users.map((user) => [user.email.toLowerCase(), user.id]),
    );
    return this.dedupeRecipients(
      rawRecipients
        .map((recipient) => {
          const recipientId = emailToIdMap.get(recipient.email);
          return recipientId
            ? {
                recipientId,
                type: recipient.type as RecipientType,
              }
            : null;
        })
        .filter((recipient): recipient is RecipientInput => recipient !== null),
    );
  }

  private mapRecipients(ids: string[], type: RecipientType): RecipientInput[] {
    return ids.map((recipientId) => ({
      recipientId,
      type,
    }));
  }

  private dedupeRecipients(recipients: RecipientInput[]) {
    const seen = new Set<string>();
    return recipients.filter((recipient) => {
      if (seen.has(recipient.recipientId)) {
        return false;
      }

      seen.add(recipient.recipientId);
      return true;
    });
  }

  private async replaceRecipients(
    manager: EntityManager,
    messageId: string,
    recipients: RecipientInput[],
  ) {
    await manager.delete(MessageRecipient, { messageId });

    const validRecipients = recipients.filter(
      (recipient) => !!recipient.recipientId,
    );
    if (validRecipients.length > 0) {
      const entities = validRecipients.map((recipient) =>
        manager.create(MessageRecipient, { ...recipient, messageId }),
      );
      await manager.save(entities);

      const persistedCount = await manager.count(MessageRecipient, {
        where: { messageId },
      });

      if (persistedCount !== validRecipients.length) {
        throw new BadRequestException(
          "Failed to persist all message recipients",
        );
      }
    }
  }

  private async replaceAttachments(
    manager: EntityManager,
    messageId: string,
    senderId: string,
    attachmentIds: string[],
  ) {
    await manager.update(Attachment, { messageId }, { messageId: null });

    if (!attachmentIds.length) {
      return;
    }

    const attachments = await manager.find(Attachment, {
      where: [
        {
          id: In(attachmentIds),
          uploaderId: senderId,
          messageId: IsNull(),
        },
        {
          id: In(attachmentIds),
          uploaderId: senderId,
          messageId,
        },
      ],
    });

    if (attachments.length !== attachmentIds.length) {
      throw new BadRequestException("One or more attachments are invalid");
    }

    for (const attachment of attachments) {
      attachment.messageId = messageId;
    }

    await manager.save(attachments);
  }

  private async findOwnedDraft(
    manager: EntityManager,
    draftId: string,
    senderId: string,
  ) {
    const draft = await manager.findOne(Message, {
      where: {
        id: draftId,
        senderId,
        isDraft: true,
      },
    });

    if (!draft) {
      throw new NotFoundException("Draft not found");
    }

    return draft;
  }

  private includesRecipientUpdate(dto: SaveDraftDto): boolean {
    return (
      Object.prototype.hasOwnProperty.call(dto, "toEmails") ||
      Object.prototype.hasOwnProperty.call(dto, "ccEmails") ||
      Object.prototype.hasOwnProperty.call(dto, "bccEmails")
    );
  }

  private async getVisibleThreadMessages(threadId: string, userId: string) {
    let messages = await this.messageRepo
      .createQueryBuilder("message")
      .leftJoinAndSelect("message.sender", "sender")
      .leftJoinAndSelect("message.recipients", "recipient")
      .leftJoinAndSelect("recipient.recipient", "recipientUser")
      .leftJoinAndSelect("message.attachments", "attachment")
      .leftJoin(
        "message.recipients",
        "accessRecipient",
        `
        accessRecipient.recipientId = :userId
        AND accessRecipient.isDeleted = false
        `,
        { userId },
      )
      .where("message.threadId = :threadId", { threadId })
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            `
            message.senderId = :userId
            AND message.senderDeletedAt IS NULL
            `,
            { userId },
          ).orWhere("accessRecipient.id IS NOT NULL");
        }),
      )
      .orderBy("message.createdAt", "ASC")
      .getMany();

    if (!messages.length) {
      messages = await this.messageRepo
        .createQueryBuilder("message")
        .leftJoinAndSelect("message.sender", "sender")
        .leftJoinAndSelect("message.recipients", "recipient")
        .leftJoinAndSelect("recipient.recipient", "recipientUser")
        .leftJoinAndSelect("message.attachments", "attachment")
        .where("message.threadId = :threadId", { threadId })
        .andWhere(
          new Brackets((qb) => {
            qb.where(
              `
              message.senderId = :userId
              AND message.senderDeletedAt IS NOT NULL
              `,
              { userId },
            ).orWhere(
              `
              recipient.recipientId = :userId
              AND recipient.isDeleted = true
              `,
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

  private isMessageVisibleToUser(message: Message, userId: string) {
    if (message.senderId === userId) {
      return !message.senderDeletedAt;
    }

    const recipient = message.recipients?.find(
      (item) => item.recipientId === userId,
    );
    return !!recipient && !recipient.isDeleted;
  }

  private isMessageInTrashForUser(message: Message, userId: string) {
    if (message.senderId === userId && !!message.senderDeletedAt) {
      return true;
    }

    const recipient = message.recipients?.find(
      (item) => item.recipientId === userId,
    );
    return !!recipient?.isDeleted;
  }

  private isMessageStarredForUser(message: Message, userId: string) {
    if (message.senderId === userId) {
      return false;
    }

    const recipient = message.recipients?.find(
      (item) => item.recipientId === userId,
    );

    return !!recipient && !recipient.isDeleted && recipient.isStarred;
  }

  private async refreshThreadMetadata(
    manager: EntityManager,
    threadId: string,
    fallbackSubject?: string,
  ) {
    const thread = await manager.findOne(Thread, {
      where: { id: threadId },
      relations: { messages: true },
    });

    if (!thread) {
      return;
    }

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

  private async refreshUserThreadState(
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
    await manager.delete(UserThreadState, { threadId, userId });

    if (!visibleCount) {
      return;
    }

    const state = manager.create(UserThreadState, {
      threadId,
      userId,
      unreadCount: Number(aggregate?.unreadCount ?? 0),
      isStarred: Number(aggregate?.isStarred ?? 0) > 0,
      isRead: Number(aggregate?.unreadCount ?? 0) === 0,
    });

    await manager.save(state);
  }

  private async refreshThreadAfterMutation(
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

    for (const recipient of recipients) {
      await this.refreshUserThreadState(manager, threadId, recipient.userId);
    }
  }

  private async getMessageOrFail(manager: EntityManager, messageId: string) {
    const message = await manager.findOne(Message, {
      where: { id: messageId },
      relations: {
        thread: true,
        sender: true,
        recipients: {
          recipient: true,
        },
        attachments: true,
      },
    });

    if (!message) {
      throw new NotFoundException("Message not found");
    }

    return message;
  }
}
