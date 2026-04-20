import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import { Queue } from "bullmq";
import { Brackets, In, IsNull, Repository, SelectQueryBuilder } from "typeorm";
import { Attachment } from "../files/entities/attachment.entity";
import { User } from "../users/entities/user.entity";
import { MailQueryDto } from "./dto/mail-query.dto";
import { SaveDraftDto } from "./dto/save-draft.dto";
import { SendMailDto } from "./dto/send-mail.dto";
import {
  MessageRecipient,
  RecipientType,
} from "./entities/message-recipient.entity";
import { Message } from "./entities/message.entity";
import { Thread } from "./entities/thread.entity";
import { DataSource } from "typeorm";
import { EntityManager } from "typeorm";
import { SearchService } from "@modules/search/search.service";
import { UsersService } from "@modules/users/users.service";

type MailboxResponse<T> = {
  data: T[];
  total: number;
  page: number;
  lastPage: number;
};

type RecipientInput = {
  recipient_id: string;
  type: RecipientType;
};

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
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Attachment)
    private readonly attachmentRepo: Repository<Attachment>,
    @InjectQueue("mail-delivery")
    private readonly mailQueue: Queue,
    private readonly searchService: SearchService,
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
  ) {}

  private handleError(method: string, error: any) {
    // Do not mask NestJS known exceptions (BadRequestException, etc.)
    console.error(`❌ MailService.${method} failed:`, {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }

  private async paginateThreads(
    baseQuery: SelectQueryBuilder<Thread>,
    userId: string,
    page: number,
    limit: number,
  ) {
    try {
      // 1. Get total count using a cloned query to avoid side effects
      const totalResult = await baseQuery
        .clone()
        .select("COUNT(DISTINCT thread.id)", "count")
        .getRawOne<{ count: string }>();

      const total = Number(totalResult?.count || 0);

      // 2. Prepare the rows query
      const rowsQuery = baseQuery.clone();

      // Check if 'message' alias already exists to prevent "table name specified more than once"
      const hasMessageAlias = rowsQuery.expressionMap.joinAttributes.some(
        (join) => join.alias.name === "message",
      );

      if (!hasMessageAlias) {
        rowsQuery.leftJoin("thread.messages", "message");
      }

      // 3. Execute the paginated query
      const rows = await rowsQuery
        .leftJoin(
          "message.recipients",
          "unread_recipient", // We changed this from "recipient"
          "unread_recipient.recipient_id = :userId",
          { userId },
        )
        .select([
          "thread.id AS id",
          "thread.subject AS subject",
          "thread.last_activity_at AS lastActivityAt",
        ])
        .addSelect(
          // We update the COUNT to use the new alias "unread_recipient"
          "COUNT(DISTINCT CASE WHEN unread_recipient.is_read = false THEN message.id END)",
          "unreadCount",
        )
        .groupBy("thread.id")
        .addGroupBy("thread.subject")
        .addGroupBy("thread.last_activity_at")
        .orderBy("thread.last_activity_at", "DESC")
        .offset((page - 1) * limit)
        .limit(limit)
        .getRawMany();

      // 4. Fetch the latest messages for the current page of threads
      const threadIds = rows.map((r) => r.id);
      const latestMessages = threadIds.length 
        ? await this.getLatestMessagesByThread(threadIds, userId) 
        : [];

      const latestByThread = new Map(
        latestMessages.map((m) => [m.threadId, m]),
      );

      // 5. Map results to final DTO structure
      return {
        data: rows.map((row) => ({
          id: row.id,
          subject: row.subject,
          lastActivityAt: row.lastActivityAt,
          unreadCount: Number(row.unreadCount || 0),
          latestMessage: latestByThread.get(row.id) ?? null,
        })),
        total,
        page,
        lastPage: Math.ceil(total / limit) || 1,
      };
    } catch (error) {
      this.handleError("paginateThreads", error);
    }
  }

  async searchUserMail(userId: string, query: string, limit = 10) {
    try {
      return await this.messageRepo
        .createQueryBuilder("message")
        .leftJoin("message.recipients", "recipient")
        .where("message.is_draft = false")
        .andWhere(
          new Brackets((qb) => {
            qb.where("message.senderId = :userId", { userId }).orWhere(
              "recipient.recipient_id = :userId",
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
        .distinct(true) // ✅ FIX duplicate results
        .orderBy("message.sentAt", "DESC")
        .take(limit)
        .getMany();
    } catch (error) {
      this.handleError("searchUserMail", error);
    }
  }

  async getInbox(userEmail: string, query: MailQueryDto) {
    try {
      const user = await this.userService.findByEmail(userEmail);
      if (!user) throw new NotFoundException("User not found");

      const { page, limit } = this.normalizePagination(query);

      const baseQuery = this.threadRepo
        .createQueryBuilder("thread")
        .innerJoin("thread.messages", "message")
        .innerJoin("message.recipients", "recipient")
        .where("recipient.recipient_id = :userId", { userId: user.id })
        .andWhere("recipient.deleted_at IS NULL")
        .andWhere("message.is_draft = false");

      return this.paginateThreads(baseQuery, user.id, page, limit);
    } catch (error) {
      this.handleError("getInbox", error);
    }
  }


  async getSent(userEmail: string, query: MailQueryDto) {
    try {
      // 1. RESOLVE EMAIL TO UUID HERE
      const user = await this.userService.findByEmail(userEmail);
      if (!user) throw new NotFoundException("User not found");
      const userId = user.id; // This is the UUID

      // 2. BUILD THE QUERY USING THE UUID
      const baseQuery = this.threadRepo
        .createQueryBuilder("thread")
        .innerJoin("thread.messages", "message")
        .where("message.senderId = :userId", { userId }) // Use UUID here
        .andWhere("message.is_draft = false")
        .andWhere("message.sender_deleted_at IS NULL");

      // 3. PASS THE UUID (userId), NOT THE EMAIL
      return this.paginateThreads(baseQuery, userId, query.page, query.limit);
    } catch (error) {
      this.handleError("getSent", error);
    }
  }


  async getDrafts(
    userId: string,
    query: MailQueryDto,
  ): Promise<MailboxResponse<Message>> {
    try {
      const { page, limit } = this.normalizePagination(query);

      const [data, total] = await this.messageRepo.findAndCount({
        where: {
          senderId: userId,
          is_draft: true,
          sender_deleted_at: null,
        },
        relations: {
          thread: true,
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
        data,
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
      await this.ensureThreadAccess(threadId, userId);

      const messages = await this.messageRepo.find({
        where: { threadId },
        relations: {
          sender: true,
          recipients: {
            recipient: true,
          },
          attachments: true,
          thread: true,
        },
        order: {
          createdAt: "ASC",
        },
      });

      return {
        data: {
          threadId,
          messages: messages.filter((message) =>
            this.isMessageVisibleToUser(message, userId),
          ),
        }
      };
    } catch (error) {
      this.handleError("getThread", error);
    }
  }

  async getFolder(userEmail: string, folder: string, query: MailQueryDto) {
    const user = await this.userService.findByEmail(userEmail);
    if (!user) throw new NotFoundException("User not found");
    const userId = user.id; // Correct UUID
    const { page, limit } = this.normalizePagination(query);

    const baseQuery = this.threadRepo.createQueryBuilder("thread")
      .innerJoin("thread.messages", "message");

    // Add specific folder filters
    if (folder === 'sent') {
      // For SENT: You are the SENDER
      baseQuery.where("message.senderId = :userId", { userId })
              .andWhere("message.is_draft = false")
              .andWhere("message.sender_deleted_at IS NULL");
    } else if (folder === 'drafts') {
      // For DRAFTS: You are the SENDER and it's a draft
      baseQuery.where("message.senderId = :userId", { userId })
              .andWhere("message.is_draft = true");
    } else {
      // For INBOX / TRASH / ARCHIVE: You are the RECIPIENT
      baseQuery.innerJoin("message.recipients", "recipient")
              .where("recipient.recipient_id = :userId", { userId })
              .andWhere("message.is_draft = false");

      if (folder === 'inbox') {
        baseQuery.andWhere("recipient.deleted_at IS NULL");
      } else if (folder === 'trash') {
        baseQuery.andWhere("recipient.deleted_at IS NOT NULL");
      }
    }

    return this.paginateThreads(baseQuery, userId, page, limit);
  }




  async send(dto: SendMailDto, senderEmail: string) {
    try {
      // Resolve Sender ID from Email (Database or ES)
      const sender = await this.userService.findByEmail(senderEmail);
      if (!sender) throw new Error("Sender not found");
      const senderId = sender.id;
      

      const fullMessage = await this.dataSource.transaction(async (manager) => {
        const recipients = await this.buildRecipientInputs(dto, true);
        const subject = dto.subject?.trim() ?? "";
        const thread = await this.resolveThread(manager, dto.threadId, subject);
        const sentAt = new Date();

        let message: Message;

        if (dto.draftId) {
          message = await this.findOwnedDraft(manager, dto.draftId, senderId);
          message.threadId = thread.id;
          message.subject = thread.subject;
          message.body = dto.body;
          message.bodyHtml = dto.bodyHtml ?? null;
          message.is_draft = false;
          message.sentAt = sentAt;
          message.sender_deleted_at = null;
        } else {
          message = manager.create(Message, {
            threadId: thread.id,
            senderId,
            subject: dto.subject?.trim() ?? "",
            body: dto.body,
            bodyHtml: dto.bodyHtml ?? null,
            is_draft: false,
            sentAt,
          });
        }

        const savedMessage = await manager.save(message);
        thread.lastActivityAt = sentAt;
        await manager.save(thread);

        await this.replaceRecipients(manager, savedMessage.id, recipients);
        await this.attachFiles(
          manager,
          savedMessage.id,
          senderId,
          dto.attachmentIds,
        );
        if (!thread.subject && dto.subject) {
          await this.updateThreadSubject(manager, thread, dto.subject.trim());
        }

        console.log("SENDER:", senderId);
        console.log("DTO:", dto);
        console.log("THREAD ID:", thread.id);
        console.log("RECIPIENTS:", recipients);
        console.log("SAVED MESSAGE:", savedMessage);

        return manager.findOne(Message, {
          where: { id: savedMessage.id },
          relations: {
            thread: true,
            sender: true,
            recipients: { recipient: true },
            attachments: true,
          },
        });
      });

      //Index in Elasticsearch AFTER the transaction is successful
      if (fullMessage) {
        try {
          await this.searchService.indexMessage(fullMessage);
          this.logger.log(`Message ${fullMessage.id} indexed in ES`);
        } catch (esError: any) {
          // We log but don't throw, so the user still gets their success response
          this.logger.error(
            `Failed to index message ${fullMessage.id}: ${esError.message}`,
          );
        }
      }

      return fullMessage;
    } catch (error) {
      this.handleError("send", error);
    }
  }

  async saveDraft(dto: SaveDraftDto, senderId: string) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const subject = dto.subject?.trim() ?? "";
        const thread = await this.resolveThread(manager, dto.threadId, subject);

        let draft: Message;
        if (dto.draftId) {
          draft = await this.findOwnedDraft(manager, dto.draftId, senderId);
          draft.threadId = thread.id;
          draft.subject = dto.subject ?? draft.subject;
          draft.body = dto.body ?? draft.body ?? "";
          draft.bodyHtml = dto.bodyHtml ?? (dto.body ? `<p>${dto.body.replace(/\n/g, '<br>')}</p>` : draft.bodyHtml);
          draft.is_draft = true;
          draft.sentAt = null;
          draft.sender_deleted_at = null;
        } else {
          draft = manager.create(Message, {
            threadId: thread.id,
            senderId,
            subject,
            body: dto.body ?? "",
            bodyHtml: dto.bodyHtml ?? (dto.body ? `<p>${dto.body.replace(/\n/g, '<br>')}</p>` : null),
            is_draft: true,
            sentAt: null,
          });
        }

        if (dto.body !== undefined || dto.subject !== undefined) {
          thread.lastActivityAt = new Date();
          await manager.save(thread);
        }

        const savedDraft = await manager.save(draft);

        if (this.includesRecipientUpdate(dto)) {
          const recipients = await this.buildRecipientInputs(dto, false);
          await this.replaceRecipients(manager, savedDraft.id, recipients);
        }

        if (dto.attachmentIds) {
          await this.attachFiles(
            manager,
            savedDraft.id,
            senderId,
            dto.attachmentIds,
          );
        }

        if (subject) {
          await this.updateThreadSubject(manager, thread, subject);
        }

        return await this.getMessageOrFail(manager, savedDraft.id);
      });
    } catch (error) {
      this.handleError("saveDraft", error);
    }
  }


  async getMessageById(messageId: string, userId: string) {
    // Use findOne with an OR condition or check SenderId explicitly
    const message = await this.messageRepo.findOne({
      where: [
        { id: messageId, senderId: userId }, // Case 1: User is the Sender (Drafts)
        { id: messageId, recipients: { recipient_id: userId } } // Case 2: User is a Recipient
      ],
      relations: {
        thread: true,
        recipients: { recipient: true },
        attachments: true,
      },
    });

    if (!message) {
      // This is the error you are currently seeing
      throw new NotFoundException("Message not found in recipient mailbox");
    }

    return message;
  }


  async readMessage(messageId: string, userId: string) {
    try {
      console.log({ userId, messageId });

      const message = await this.messageRepo
        .createQueryBuilder("message")
        .leftJoinAndSelect("message.sender", "sender")
        .leftJoinAndSelect(
          "message.recipients",
          "recipient",
          "recipient.recipient_id = :userId AND recipient.is_deleted = false",
          { userId },
        )
        .where("message.id = :messageId", { messageId })
        .andWhere(`(message.senderId= :userId OR recipient.id IS NOT NULL)`, {
          userId,
        })
        .getOne();

      if (!message) {
        throw new NotFoundException("Message not found");
      }

      if (!userId) {
        throw new BadRequestException("User ID is required");
      }

      // ensure user is recipient
      const isRecipient = message.recipients.some(
        (r) => r.recipient_id === userId,
      );

      const isSender = message.senderId === userId;

      if (!isRecipient && !isSender) {
        throw new ForbiddenException("Access denied");
      }

      // mark as read
      await this.markRead(messageId, userId, true);

      return {
        data: message
      };
    } catch (error) {
      this.handleError("readMessage", error);
    }
  }

  async markRead(messageId: string, userId: string, isRead = true) {
    try {
      // Fetch the message first to check its status
      const message = await this.messageRepo.findOne({ 
        where: { id: messageId } 
      });
      
      if (!message) throw new NotFoundException("Message not found");

      if (message.senderId === userId) {
        return { success: true }; 
      }
      // Return early if it's a draft to avoid the recipient check below.
      if (message.is_draft) {
        return { 
          data: { messageId, isRead: false, readAt: null } 
        };
      }

      // Look for the recipient record (only for sent messages)
      const recipient = await this.recipientRepo.findOne({
        where: {
          message_id: messageId,
          recipient_id: userId,
        },
      });

      if (!recipient) {
        throw new NotFoundException("Message not found in recipient mailbox");
      }

      // Avoid unnecessary DB writes
      if (recipient.is_read === isRead) {
        return {
          data: {
            messageId,
            isRead: recipient.is_read,
            readAt: recipient.read_at,
          }
        };
      }

      recipient.is_read = isRead;
      recipient.read_at = isRead ? new Date() : null;
      await this.recipientRepo.save(recipient);

      return {
        data: {
          messageId,
          isRead: recipient.is_read,
          readAt: recipient.read_at,
        }
      };
    } catch (error) {
      this.handleError("markRead", error);
    }
  }


  async markManyAsRead(messageIds: string[], userId: string) {
    try {
      if (!messageIds.length) return;

      await this.recipientRepo
        .createQueryBuilder()
        .update()
        .set({
          is_read: true,
          read_at: new Date(),
        })
        .where("recipient_id = :userId", { userId })
        .andWhere("message_id IN (:...messageIds)", { messageIds })
        .execute();

      return {
        data:{
          messageIds,
          isRead: true,
        }
      };
    } catch (error) {
      this.handleError("markManyAsRead", error);
    }
  }

  async markThreadAsRead(threadId: string, userId: string) {
    try {
      await this.recipientRepo
        .createQueryBuilder("recipient")
        .update()
        .set({
          is_read: true,
          read_at: new Date(),
        })
        .where("recipient_id = :userId", { userId })
        // Use a subquery to filter by thread_id
        .andWhere(
          "message_id IN (" +
            this.messageRepo
              .createQueryBuilder("msg")
              .select("msg.id")
              .where("msg.thread_id = :threadId")
              .getQuery() +
            ")",
          { threadId },
        )
        .execute();

      return {
        data: {
          threadId, 
          isRead: true 
        }
      };
    } catch (error) {
      this.handleError("markThreadAsRead", error);
    }
  }

  async readThread(threadId: string, userId: string) {
    try {
      await this.ensureThreadAccess(threadId, userId);

      const messages = await this.messageRepo.find({
        where: { threadId },
        relations: {
          sender: true,
          recipients: {
            recipient: true,
          },
          attachments: true,
        },
        order: {
          createdAt: "ASC",
        },
      });

      // mark entire thread as read
      await this.markThreadAsRead(threadId, userId);

      return {
        data: {
          threadId,
          messages: messages.filter((m) =>
            this.isMessageVisibleToUser(m, userId),
          ),
        }
      };
    } catch (error) {
      this.handleError("readThread", error);
    }
  }

  async toggleStar(messageId: string, userId: string, isStarred?: boolean) {
    try {
      const recipient = await this.recipientRepo.findOne({
        where: {
          message_id: messageId,
          recipient_id: userId,
        },
      });

      if (!recipient) {
        throw new NotFoundException("Message not found in recipient mailbox");
      }

      recipient.is_starred = isStarred ?? !recipient.is_starred;
      await this.recipientRepo.save(recipient);

      return {
        data: {
          messageId,
          isStarred: recipient.is_starred,
        }
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

      let changed = false;
      const now = new Date();

      // If User is the Sender
      if (message.senderId === userId) {
        message.sender_deleted_at = now;
        await this.messageRepo.save(message);
        changed = true;
      }

      // If User is a Recipient
      const recipient = message.recipients.find(
        (item) => item.recipient_id === userId,
      );
      if (recipient) {
        recipient.is_deleted = true;
        recipient.deleted_at = now;
        await this.recipientRepo.save(recipient);
        changed = true;
      }

      if (!changed) {
        throw new ForbiddenException("No access to this message");
      }

      return {
        data: {
          messageId,
          status: "moved_to_trash",
        }
      };
    } catch (error) {
      this.handleError("moveToTrash", error);
    }
  }

  async getTrash(userId: string, query: MailQueryDto) {
    try {
      const { page, limit } = this.normalizePagination(query);

      const baseQuery = this.threadRepo
        .createQueryBuilder("thread")
        .innerJoin("thread.messages", "message")
        .innerJoin("message.recipients", "recipient")
        .where("recipient.recipient_id = :userId", { userId })
        .andWhere("recipient.is_deleted = true") // Only show trashed items
        .orderBy("recipient.deleted_at", "DESC");

      return this.paginateThreads(baseQuery, userId, page, limit);
    } catch (error) {
      this.handleError("getTrash", error);
    }
  }

  async restoreFromTrash(messageId: string, userId: string) {
    try {
      const message = await this.messageRepo.findOne({
        where: { id: messageId },
        relations: { recipients: true },
      });

      if (!message) {
        throw new NotFoundException("Message not found");
      }

      let changed = false;

      // 1. If User is the Sender, clear their deletion timestamp
      if (message.senderId === userId && message.sender_deleted_at !== null) {
        message.sender_deleted_at = null;
        await this.messageRepo.save(message);
        changed = true;
      }

      // 2. If User is a Recipient, toggle is_deleted back to false
      const recipient = message.recipients.find(
        (item) => item.recipient_id === userId,
      );

      if (recipient && recipient.is_deleted) {
        recipient.is_deleted = false;
        recipient.deleted_at = null; // Clear the trash timestamp
        await this.recipientRepo.save(recipient);
        changed = true;
      }

      if (!changed) {
        throw new BadRequestException(
          "Message is not in trash or you don't have access",
        );
      }

      return {
        data:{
          messageId,
          restored: true,
        }
      };
    } catch (error) {
      this.handleError("restoreFromTrash", error);
    }
  }

  async permanentlyDelete(messageId: string, userId: string) {
    try {
      // 1. Find the message and its recipients
      const message = await this.messageRepo.findOne({
        where: { id: messageId },
        relations: { recipients: true },
      });

      if (!message) throw new NotFoundException("Message not found");

      // 2. If User is the Sender, we hard delete the message ONLY IF
      // there are no other active recipients who haven't deleted it yet.
      // Otherwise, we just nullify the senderId to "detach" them.
      if (message.senderId === userId) {
        await this.messageRepo.delete(messageId);
        // Note: CASCADE deletes in your DB will handle recipients/attachments
        // if configured, otherwise delete them manually first.
        return { messageId, status: "permanently_deleted_by_sender" };
      }

      // 3. If User is a Recipient, hard delete their recipient record
      const recipient = message.recipients.find(
        (r) => r.recipient_id === userId,
      );
      if (recipient && recipient.is_deleted) {
        await this.recipientRepo.remove(recipient);
        return { data:{
          messageId, 
          status: "permanently_deleted_by_recipient" 
        }
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
      // Delete all recipient records for this user that are marked as deleted
      const result = await this.recipientRepo
        .createQueryBuilder()
        .delete()
        .where("recipient_id = :userId", { userId })
        .andWhere("is_deleted = true")
        .execute();

      // Also clear sender_deleted_at messages if this user was the sender
      await this.messageRepo
        .createQueryBuilder()
        .delete()
        .where("senderId = :userId", { userId })
        .andWhere("sender_deleted_at IS NOT NULL")
        .execute();

      return {
        data: {
          success: true,
          count: result.affected,
        }
      };
    } catch (error) {
      this.handleError("emptyAllTrash", error);
    }
  }

  private normalizePagination(query: MailQueryDto) {
    return {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
  }

  private async getLatestMessagesByThread(threadIds: string[], userId: string) {
    if (!threadIds.length) return [];

    // Use snake_case for the alias to prevent PostgreSQL case-sensitivity issues
    const subQuery = this.messageRepo
      .createQueryBuilder("m")
      .select("MAX(m.created_at)", "max_created_at") // explicitly use database column name and simple alias
      .addSelect("m.thread_id", "thread_id")
      .where("m.thread_id IN (:...threadIds)", { threadIds })
      .andWhere("m.is_draft = false")
      .groupBy("m.thread_id");

    const latestMessages = await this.messageRepo
      .createQueryBuilder("message")
      .innerJoin(
        `(${subQuery.getQuery()})`,
        "latest",
        // Reference the snake_case alias here
        "latest.thread_id = message.thread_id AND latest.max_created_at = message.created_at"
      )
      .leftJoinAndSelect("message.sender", "sender")
      .leftJoinAndSelect("message.recipients", "recipients")
      .leftJoinAndSelect("message.attachments", "attachments")
      .setParameters(subQuery.getParameters())
      .getMany();

    return latestMessages.filter((m) =>
      this.isMessageVisibleToUser(m, userId),
    );
  }


  private async resolveThread(
    manager: EntityManager,
    threadId?: string,
    subject?: string,
  ): Promise<Thread> {
    if (threadId) {
      const thread = await manager.findOne(Thread, { where: { id: threadId } });
      if (!thread) {
        throw new NotFoundException("Thread not found");
      }
      return thread;
    }

    if (subject) {
      const normalizedSubject = subject.toLowerCase().trim();
      const existingThread = await manager.findOne(Thread, {
        where: { subject: normalizedSubject },
        order: { lastActivityAt: 'DESC' }, // Link to the most recent one
      });

      if (existingThread) return existingThread;
    }

    const newThread = manager.create(Thread, {
      subject: subject?.toLowerCase().trim() || "No Subject",
      lastActivityAt: new Date(),
    });

    return manager.save(newThread);
  }

  private async updateThreadSubject(
    manager: EntityManager,
    thread: Thread,
    subject: string,
  ) {
    if (!thread.subject) {
      thread.subject = subject;
      await manager.save(thread);
    }
  }

  private async buildRecipientInputs(
    dto: Partial<Pick<SendMailDto, "toEmails" | "ccEmails" | "bccEmails">> &
      Partial<Pick<SaveDraftDto, "toEmails" | "ccEmails" | "bccEmails">>,
    requireAtLeastOne: boolean,
  ): Promise<RecipientInput[]> {
     // Map the emails to temporary objects with their types
    const rawRecipients = [
      ...(dto.toEmails ?? []).map(email => ({ email: email.toLowerCase().trim(), type: "to" })),
      ...(dto.ccEmails ?? []).map(email => ({ email: email.toLowerCase().trim(), type: "cc" })),
      ...(dto.bccEmails ?? []).map(email => ({ email: email.toLowerCase().trim(), type: "bcc" })),
    ];

    if (requireAtLeastOne && rawRecipients.length === 0) {
      throw new BadRequestException("At least one recipient is required");
    }

    if (!rawRecipients.length) {
      return [];
    }

    // Find Users by Email in the DB
    const distinctEmails = [...new Set(rawRecipients.map(r => r.email))];
    const users = await this.userRepo.find({
      where: {
        email: In(distinctEmails), // Query by email
        isActive: true,
      },
      select: ["id", "email"], // We need ID to link the recipient
    });

    // Validate that all provided emails actually exist as users
    if (users.length !== distinctEmails.length) {
      if (requireAtLeastOne) {
        throw new BadRequestException("One or more recipient emails are invalid");
      } else {
        // For drafts, just log a warning or filter out the missing ones
        this.logger.warn("Some draft recipients not found in DB; skipping those entries.");
      }
    }

    const emailToIdMap = new Map(users.map(u => [u.email, u.id]));

    // Return the final RecipientInput array using the IDs found
    return rawRecipients
    .map(r => {
      const recipient_id = emailToIdMap.get(r.email);
      return recipient_id ? { recipient_id, type: r.type as 'to' | 'cc' | 'bcc' } : null;
    })
    .filter((r): r is RecipientInput => r !== null); 

  }

  private mapRecipients(ids: string[], type: RecipientType): RecipientInput[] {
    return ids.map((recipient_id) => ({
      recipient_id,
      type,
    }));
  }

  private dedupeRecipients(recipients: RecipientInput[]) {
    const seen = new Set<string>();
    return recipients.filter((recipient) => {
      if (seen.has(recipient.recipient_id)) {
        return false;
      }

      seen.add(recipient.recipient_id);
      return true;
    });
  }

  private async replaceRecipients(
    manager: EntityManager,
    messageId: string,
    recipients: RecipientInput[],
  ) {
    await manager.delete(MessageRecipient, { message_id: messageId });

    const validRecipients = recipients.filter(r => !!r.recipient_id);
    if (validRecipients.length > 0) {
      const entities = validRecipients.map(r => 
        manager.create(MessageRecipient, { ...r, message_id: messageId })
      );
      return await manager.save(entities);
    }
  }

  private async attachFiles(
    manager: EntityManager,
    messageId: string,
    senderId: string,
    attachmentIds?: string[],
  ) {
    if (!attachmentIds?.length) {
      return;
    }

    const attachments = await manager.find(Attachment, {
      where: {
        id: In(attachmentIds),
        uploader_id: senderId,
      },
    });

    if (attachments.length !== attachmentIds.length) {
      throw new BadRequestException("One or more attachments are invalid");
    }

    for (const attachment of attachments) {
      attachment.message_id = messageId;
    }

    if (attachments.length) {
      await manager.save(attachments);
    }
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
        is_draft: true,
      },
    });

    if (!draft) {
      throw new NotFoundException("Draft not found");
    }

    return draft;
  }

  private includesRecipientUpdate(dto: SaveDraftDto): boolean {
    return !!(dto.toEmails?.length || dto.ccEmails?.length || dto.bccEmails?.length);
  }

  private async ensureThreadAccess(threadId: string, userId: string) {
    const count = await this.messageRepo
      .createQueryBuilder("message")
      .leftJoin("message.recipients", "recipient")
      .where("message.thread_id = :threadId", { threadId })
      .andWhere(
        "(message.sender_id = :userId OR (recipient.recipient_id = :userId AND recipient.is_deleted = false))",
        { userId },
      )
      .getCount();

    if (!count) {
      throw new ForbiddenException("You do not have access to this thread");
    }
  }

  private isMessageVisibleToUser(message: Message, userId: string) {
    if (message.senderId === userId) {
      return !message.sender_deleted_at;
    }

    const recipient = message.recipients.find(
      (item) => item.recipient_id === userId,
    );
    return !!recipient && !recipient.is_deleted;
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
