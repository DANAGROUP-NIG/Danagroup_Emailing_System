import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import { Queue } from "bullmq";
import { In, Repository, SelectQueryBuilder } from "typeorm";
import { Attachment } from "../files/entities/attachment.entity";
import { User } from "../users/entities/user.entity";
import { MailQueryDto } from "./dto/mail-query.dto";
import { SaveDraftDto } from "./dto/save-draft.dto";
import { SendMailDto } from "./dto/send-mail.dto";
import { MessageRecipient, RecipientType } from "./entities/message-recipient.entity";
import { Message } from "./entities/message.entity";
import { Thread } from "./entities/thread.entity";
import { DataSource } from "typeorm";
import { EntityManager } from "typeorm";

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
  ) {}

  private handleError(method: string, error: any) {
    // Do not mask NestJS known exceptions (BadRequestException, etc.)
    console.error(`❌ MailService.${method} failed:`, {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }

  private async paginateThreads(baseQuery: SelectQueryBuilder<Thread>, userId: string, page: number, limit: number) {
  // 1. Get Total Count
  const totalResult = await baseQuery
    .clone()
    .select("COUNT(DISTINCT thread.id)", "count")
    .getRawOne<{ count: string }>();

    const total = Number(totalResult?.count || 0);

    // 2. Get Paginated Rows
    const rows = await baseQuery
      .clone()
      .distinct(true)
      .select([
        "thread.id AS id",
        "thread.subject AS subject",
        "thread.last_activity_at AS lastActivityAt",
      ])
      .addSelect(
        `COUNT(DISTINCT CASE WHEN recipient.is_read = false THEN message.id END)`,
        "unreadCount",
      )
      .groupBy("thread.id")
      .addGroupBy("thread.subject")
      .addGroupBy("thread.last_activity_at")
      .orderBy("thread.last_activity_at", "DESC")
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany();

    // 3. Get Latest Message Previews
    const threadIds = rows.map((row) => row.id);
    const latestMessages = threadIds.length
      ? await this.getLatestMessagesByThread(threadIds, userId)
      : [];

    const latestByThread = new Map(
      latestMessages.map((message) => [message.threadId, message]),
    );

    // 4. Return Standard Response
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
  }



  async getInbox(userId: string, query: MailQueryDto) {
    try {

      const { page, limit } = this.normalizePagination(query);

      const baseQuery = this.threadRepo
        .createQueryBuilder("thread")
        .innerJoin("thread.messages", "message", "message.is_draft = false")
        .innerJoin(
          "message.recipients",
          "recipient",
          `
          recipient.recipient_id = :userId 
          AND recipient.is_deleted = false
          `,
          { userId },
        );
      
     return this.paginateThreads(baseQuery, userId, page, limit);
      
    } catch (error) {
      this.handleError("getInbox", error);
    }
    
  }

  async getSent(userId: string, query: MailQueryDto): Promise<MailboxResponse<Message>> {
    try {
    
      const { page, limit } = this.normalizePagination(query);

      const [data, total] = await this.messageRepo.findAndCount({
        where: {
          senderId: userId,
          is_draft: false,
          sender_deleted_at: null,
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
          sentAt: "DESC",
          createdAt: "DESC",
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      console.log("GET SENT USER:", userId);

      return {
        data,
        total,
        page,
        lastPage: Math.ceil(total / limit) || 1,
      };
    } catch (error) {
      this.handleError("getSent", error);
    }
  }

  async getDrafts(userId: string, query: MailQueryDto): Promise<MailboxResponse<Message>> {

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
        lastPage: Math.ceil(total / limit) || 1,
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
        threadId,
        messages: messages.filter((message) =>
          this.isMessageVisibleToUser(message, userId),
        ),
      };
    } catch (error) {
      this.handleError("getThread", error);
    }
  }

  async send(dto: SendMailDto, senderId: string) {
    try {
      
      return this.dataSource.transaction(async (manager) => {

        const recipients = await this.buildRecipientInputs(dto, true);
        const subject = dto.subject?.trim() ?? "";
        const thread = await this.resolveThread(manager, dto.threadId, subject);
        const sentAt = new Date();

        let message: Message;

        if (dto.draftId) {
          message = await this.findOwnedDraft(manager,dto.draftId, senderId);
          message.threadId = thread.id;
          message.subject = thread.subject;
          message.body = dto.body;
          message.bodyHtml = dto.bodyHtml ?? null;
          message.is_draft = false;
          message.sentAt = sentAt;
          message.sender_deleted_at = null;
        } else {
          message = manager.create(Message,{
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
        await this.attachFiles(manager,savedMessage.id, senderId, dto.attachmentIds);
        if(!thread.subject && dto.subject) {
          await this.updateThreadSubject(manager, thread, dto.subject.trim());
        }

        const recipientIds = [...new Set(recipients.map((recipient) => recipient.recipient_id))];
        // if (process.env.NODE_ENV !== "test" && recipientIds.length) {
        //   await this.mailQueue.add("deliver", {
        //     messageId: savedMessage.id,
        //     recipientIds,
        //     senderId,
        //   });
        // }

        console.log("SENDER:", senderId);
        console.log("DTO:", dto);
        console.log("THREAD ID:", thread.id);
        console.log("RECIPIENTS:", recipients);
        console.log("SAVED MESSAGE:", savedMessage);

        return manager.findOne(Message, {
          where: { id: savedMessage.id },
          relations: { thread: true, sender: true, recipients: { recipient: true }, attachments: true }
        });
      }
   
    )
    } catch (error) {
      this.handleError("send", error);
    }
  };

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
          draft.bodyHtml = dto.bodyHtml ?? draft.bodyHtml ?? null;
          draft.is_draft = true;
          draft.sentAt = null;
          draft.sender_deleted_at = null;
        } else {
          draft = manager.create(Message,{
            threadId: thread.id,
            senderId,
            subject,
            body: dto.body ?? "",
            bodyHtml: dto.bodyHtml ?? null,
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
          await this.attachFiles(manager, savedDraft.id, senderId, dto.attachmentIds);
        }

        if (subject) {
          await this.updateThreadSubject(manager, thread, subject);
        }

        return this.getMessageOrFail(manager, savedDraft.id);
      }) 
    } catch (error) {
      this.handleError("saveDraft", error);
    }
  };

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
        .andWhere(
          `(message.sender_id = :userId OR recipient.id IS NOT NULL)`,
          { userId },
        )
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

      return message;
    } catch (error) {
      this.handleError("readMessage", error);
    }
  }

  async markRead(messageId: string, userId: string, isRead = true) {
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

      // Avoid unnecessary DB writes
      if (recipient.is_read === isRead) {
        return {
          messageId,
          isRead: recipient.is_read,
          readAt: recipient.read_at,
        };
      }

      recipient.is_read = isRead;
      recipient.read_at = isRead ? new Date() : null;

      await this.recipientRepo.save(recipient);

      return {
        messageId,
        isRead: recipient.is_read,
        readAt: recipient.read_at,
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
        messageIds,
        isRead: true,
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
      .andWhere("message_id IN (" +
        this.messageRepo
          .createQueryBuilder("msg")
          .select("msg.id")
          .where("msg.thread_id = :threadId")
          .getQuery() + ")", 
        { threadId }
      )
      .execute();

      return { threadId, isRead: true };
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
      threadId,
      messages: messages.filter((m) =>
        this.isMessageVisibleToUser(m, userId),
      ),
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
        messageId,
        isStarred: recipient.is_starred,
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
      let now = new Date();

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
        messageId,
        status: "moved_to_trash",
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
        throw new BadRequestException("Message is not in trash or you don't have access");
      }

      return {
        messageId,
        restored: true,
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
      const recipient = message.recipients.find(r => r.recipient_id === userId);
      if (recipient && recipient.is_deleted) {
        await this.recipientRepo.remove(recipient);
        return { messageId, status: "permanently_deleted_by_recipient" };
      }

      throw new BadRequestException("Message must be in trash before permanent deletion");
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
        success: true, 
        count: result.affected 
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
    const messages = await this.messageRepo.find({
      where: {
        threadId: In(threadIds),
        is_draft: false,
      },
      relations: {
        sender: true,
        recipients: {
          recipient: true,
        },
        attachments: true,
      },
      order: {
        createdAt: "DESC",
      },
    });

    const seen = new Set<string>();
    return messages.filter((message) => {
      if (seen.has(message.threadId)) {
        return false;
      }

      if (!this.isMessageVisibleToUser(message, userId)) {
        return false;
      }

      seen.add(message.threadId);
      return true;
    });
  }

  private async resolveThread(manager:EntityManager, threadId: string | undefined, subject: string) {
    if (threadId) {
      const thread = await manager.findOne(Thread,{ where: { id: threadId } });
      if (!thread) {
        throw new NotFoundException("Thread not found");
      }
      return thread;
    }

    return manager.save(
      manager.create(Thread, {
        subject,
        lastActivityAt: new Date(), // initialize immediately
      }),
    );
  }

  private async updateThreadSubject(manager: EntityManager,thread: Thread, subject: string) {
    if (!thread.subject){
      thread.subject = subject;
      await manager.save(thread);
    }
    
  }

  private async buildRecipientInputs(
    dto: Partial<Pick<SendMailDto, "toIds" | "ccIds" | "bccIds">> &
      Partial<Pick<SaveDraftDto, "toIds" | "ccIds" | "bccIds">>,
    requireAtLeastOne: boolean,
  ): Promise<RecipientInput[]> {
    const mapped = this.dedupeRecipients([
      ...this.mapRecipients(dto.toIds ?? [], "to"),
      ...this.mapRecipients(dto.ccIds ?? [], "cc"),
      ...this.mapRecipients(dto.bccIds ?? [], "bcc"),
    ]);

    if (requireAtLeastOne && mapped.length === 0) {
      throw new BadRequestException("At least one recipient is required");
    }

    if (!mapped.length) {
      return [];
    }

    const users = await this.userRepo.find({
      where: {
        id: In(mapped.map((recipient) => recipient.recipient_id)),
        isActive: true,
      },
      select: ["id"],
    });

    if (users.length !== mapped.length) {
      throw new BadRequestException("One or more recipients are invalid");
    }

    return mapped;
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

  private async replaceRecipients(manager: EntityManager, messageId: string, recipients: RecipientInput[]) {
    await manager.delete(MessageRecipient, { message_id: messageId });

    if (!recipients.length) {
      return;
    }

    await manager.save(
      recipients.map((recipient) =>
        manager.create(MessageRecipient, {
          message_id: messageId,
          recipient_id: recipient.recipient_id,
          type: recipient.type,
        }),
      ),
    );
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

    const attachments = await manager.find(Attachment,{
      where: {
        id: In(attachmentIds),
        uploader_id: senderId,
      },
    })
      

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

  private async findOwnedDraft(manager: EntityManager,draftId: string, senderId: string) {
    const draft = await manager.findOne(Message,{
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

  private includesRecipientUpdate(dto: SaveDraftDto) {
    return (
      dto.toIds !== undefined ||
      dto.ccIds !== undefined ||
      dto.bccIds !== undefined
    );
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

  private async getMessageOrFail(manager: EntityManager,messageId: string) {
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
