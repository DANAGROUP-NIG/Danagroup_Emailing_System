import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Brackets, In } from "typeorm";
import { MailMapper } from "./mappers/mail.mapper";
import { MailCoreService } from "./mail-core.service";
import { MailboxService } from "./mailbox.service";
import { JobsService } from "@jobs/jobs.service";

@Injectable()
export class MailActionService {
  constructor(
    private readonly core: MailCoreService,
    private readonly mailboxService: MailboxService,
    private readonly jobsService: JobsService,
  ) {}

  // ─── Read message ─────────────────────────────────────────────────────────

  async readMessage(messageId: string, userId: string) {
    try {
      if (!userId) throw new BadRequestException("User ID is required");

      const message = await this.core.messageRepo
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

      if (!message) throw new NotFoundException("Message not found");

      const isRecipient = message.recipients.some(
        (r) => r.recipientId === userId,
      );
      const isSender = message.senderId === userId;

      if (!isRecipient && !isSender)
        throw new ForbiddenException("Access denied");

      await this.markRead(messageId, userId, true);

      return { data: MailMapper.toMessage(message, userId) };
    } catch (error) {
      this.core.handleError("MailActionService.readMessage", error);
    }
  }

  // ─── Mark read ────────────────────────────────────────────────────────────

  async markRead(messageId: string, userId: string, isRead = true) {
    try {
      const message = await this.core.messageRepo.findOne({
        where: { id: messageId },
      });
      if (!message) throw new NotFoundException("Message not found");

      if (message.senderId === userId) return { success: true };
      if (message.isDraft)
        return { data: { messageId, isRead: false, readAt: null } };

      const recipient = await this.core.recipientRepo.findOne({
        where: { messageId, recipientId: userId },
      });

      if (!recipient)
        throw new NotFoundException("Message not found in recipient mailbox");

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
      await this.core.recipientRepo.save(recipient);
      await this.core.refreshUserThreadState(
        this.core.dataSource.manager,
        message.threadId,
        userId,
      );
      this.core.emitMailReadEvent(
        userId,
        messageId,
        message.threadId,
        recipient.readAt,
      );
      this.core.emitMailboxChanged(userId, {
        action: "read_state_changed",
        messageId,
        threadId: message.threadId,
        folders: recipient.isStarred ? ["inbox", "starred"] : ["inbox"],
      });

      return {
        data: { messageId, isRead: recipient.isRead, readAt: recipient.readAt },
      };
    } catch (error) {
      this.core.handleError("MailActionService.markRead", error);
    }
  }

  async markManyAsRead(messageIds: string[], userId: string) {
    try {
      if (!messageIds.length) return { data: { messageIds, isRead: true } };

      await this.core.recipientRepo
        .createQueryBuilder()
        .update()
        .set({ isRead: true, readAt: new Date() })
        .where("recipientId = :userId", { userId })
        .andWhere("messageId IN (:...messageIds)", { messageIds })
        .execute();

      const messages = await this.core.messageRepo.find({
        where: { id: In(messageIds) },
        select: ["id", "threadId"],
      });

      await Promise.all(
        [...new Set(messages.map((m) => m.threadId))].map((threadId) =>
          this.core.refreshUserThreadState(
            this.core.dataSource.manager,
            threadId,
            userId,
          ),
        ),
      );

      for (const message of messages) {
        this.core.emitMailReadEvent(
          userId,
          message.id,
          message.threadId,
          new Date(),
        );
      }

      this.core.emitMailboxChanged(userId, {
        action: "read_state_changed",
        messageIds,
        threadIds: [...new Set(messages.map((m) => m.threadId))],
        folders: ["inbox", "starred"],
      });

      return { data: { messageIds, isRead: true } };
    } catch (error) {
      this.core.handleError("MailActionService.markManyAsRead", error);
    }
  }

  async markThreadAsRead(threadId: string, userId: string) {
    try {
      const updateResult = await this.core.recipientRepo
        .createQueryBuilder()
        .update()
        .set({ isRead: true, readAt: new Date() })
        .where("recipientId = :userId", { userId })
        .andWhere(
          "messageId IN (" +
            this.core.messageRepo
              .createQueryBuilder("msg")
              .select("msg.id")
              .where("msg.threadId = :threadId")
              .getQuery() +
            ")",
          { threadId },
        )
        .andWhere("isRead = false")
        .execute();

      if ((updateResult.affected ?? 0) > 0) {
        await this.core.refreshUserThreadState(
          this.core.dataSource.manager,
          threadId,
          userId,
        );
        this.core.mailGateway.emitMailRead(userId, {
          threadId,
          isRead: true,
          readAt: new Date().toISOString(),
        });
        this.core.emitMailboxChanged(userId, {
          action: "read_state_changed",
          threadId,
          folders: ["inbox", "starred"],
        });
      }

      return { data: { threadId, isRead: true } };
    } catch (error) {
      this.core.handleError("MailActionService.markThreadAsRead", error);
    }
  }

  async readThread(threadId: string, userId: string) {
    try {
      await this.markThreadAsRead(threadId, userId);
      const visibleMessages =
        await this.mailboxService.getVisibleThreadMessages(threadId, userId);
      return {
        data: MailMapper.toThreadDetail(threadId, visibleMessages, userId),
      };
    } catch (error) {
      this.core.handleError("MailActionService.readThread", error);
    }
  }

  // ─── Star ─────────────────────────────────────────────────────────────────

  async toggleStar(messageId: string, userId: string, isStarred?: boolean) {
    try {
      const recipient = await this.core.recipientRepo.findOne({
        where: { messageId, recipientId: userId },
      });

      if (!recipient)
        throw new NotFoundException("Message not found in recipient mailbox");

      recipient.isStarred = isStarred ?? !recipient.isStarred;
      await this.core.recipientRepo.save(recipient);

      const message = await this.core.messageRepo.findOne({
        where: { id: messageId },
        select: ["threadId"],
      });

      if (message) {
        await this.core.refreshUserThreadState(
          this.core.dataSource.manager,
          message.threadId,
          userId,
        );
        this.core.emitMailboxChanged(userId, {
          action: "star_state_changed",
          messageId,
          threadId: message.threadId,
          folders: recipient.isDeleted
            ? ["trash", "starred"]
            : ["inbox", "starred"],
        });
      }

      return { data: { messageId, isStarred: recipient.isStarred } };
    } catch (error) {
      this.core.handleError("MailActionService.toggleStar", error);
    }
  }

  async toggleThreadStar(
    threadId: string,
    userId: string,
    isStarred?: boolean,
  ) {
    try {
      const recipients = await this.core.recipientRepo
        .createQueryBuilder("recipient")
        .innerJoinAndSelect("recipient.message", "message")
        .where("message.threadId = :threadId", { threadId })
        .andWhere("message.isDraft = false")
        .andWhere("recipient.recipientId = :userId", { userId })
        .andWhere("recipient.isDeleted = false")
        .orderBy("COALESCE(message.sentAt, message.createdAt)", "DESC")
        .getMany();

      if (!recipients.length) {
        throw new NotFoundException("Thread not found in recipient mailbox");
      }

      const currentlyStarred = recipients.some(
        (recipient) => recipient.isStarred,
      );
      const nextStarred = isStarred ?? !currentlyStarred;

      if (nextStarred) {
        const target = recipients[0];
        target.isStarred = true;
        await this.core.recipientRepo.save(target);
      } else {
        const starredRecipients = recipients.filter(
          (recipient) => recipient.isStarred,
        );
        if (starredRecipients.length) {
          starredRecipients.forEach((recipient) => {
            recipient.isStarred = false;
          });
          await this.core.recipientRepo.save(starredRecipients);
        }
      }

      await this.core.refreshUserThreadState(
        this.core.dataSource.manager,
        threadId,
        userId,
      );
      this.core.emitMailboxChanged(userId, {
        action: "star_state_changed",
        messageId: recipients[0].messageId,
        threadId,
        folders: ["inbox", "starred"],
      });

      return {
        data: {
          threadId,
          messageId: recipients[0].messageId,
          isStarred: nextStarred,
        },
      };
    } catch (error) {
      this.core.handleError("MailActionService.toggleThreadStar", error);
    }
  }

  // ─── Trash ────────────────────────────────────────────────────────────────

  async moveToTrash(messageId: string, userId: string) {
    try {
      const message = await this.core.messageRepo.findOne({
        where: { id: messageId },
        relations: { recipients: true },
      });

      if (!message) throw new NotFoundException("Message not found");

      const previousFolders = this.core.getUserMailboxFoldersForMessage(
        message,
        userId,
      );
      let changed = false;
      const now = new Date();

      if (message.senderId === userId) {
        message.senderDeletedAt = now;
        await this.core.messageRepo.save(message);
        changed = true;
      }

      const recipient = message.recipients.find(
        (r) => r.recipientId === userId,
      );
      if (recipient) {
        recipient.isDeleted = true;
        recipient.deletedAt = now;
        await this.core.recipientRepo.save(recipient);
        changed = true;
      }

      if (!changed) throw new ForbiddenException("No access to this message");

      await Promise.all([
        this.core.refreshThreadAfterMutation(
          this.core.dataSource.manager,
          message.threadId,
        ),
        this.core.refreshUserThreadState(
          this.core.dataSource.manager,
          message.threadId,
          userId,
        ),
      ]);

      this.core.emitMailboxChanged(userId, {
        action: "moved_to_trash",
        messageId,
        threadId: message.threadId,
        folders: this.core.uniqueFolders([...previousFolders, "trash"]),
      });

      return { data: { messageId, status: "moved_to_trash" } };
    } catch (error) {
      this.core.handleError("MailActionService.moveToTrash", error);
    }
  }

  async restoreFromTrash(messageId: string, userId: string) {
    try {
      let message = await this.core.messageRepo.findOne({
        where: { id: messageId },
        relations: { recipients: true },
      });

      if (!message) throw new NotFoundException("Message not found");

      if (!this.core.isMessageInTrashForUser(message, userId)) {
        const trashedThreadMessage = await this.core.messageRepo
          .createQueryBuilder("message")
          .leftJoinAndSelect("message.recipients", "recipient")
          .where("message.threadId = :threadId", { threadId: message.threadId })
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

      const previousFolders = this.core.getUserMailboxFoldersForMessage(
        message,
        userId,
      );
      let changed = false;

      if (message.senderId === userId && message.senderDeletedAt !== null) {
        message.senderDeletedAt = null;
        await this.core.messageRepo.save(message);
        changed = true;
      }

      const recipient = message.recipients.find(
        (r) => r.recipientId === userId,
      );
      if (recipient && recipient.isDeleted) {
        recipient.isDeleted = false;
        recipient.deletedAt = null;
        await this.core.recipientRepo.save(recipient);
        changed = true;
      }

      if (!changed) {
        throw new BadRequestException(
          "Message is not in trash or you don't have access",
        );
      }

      await Promise.all([
        this.core.refreshThreadAfterMutation(
          this.core.dataSource.manager,
          message.threadId,
        ),
        this.core.refreshUserThreadState(
          this.core.dataSource.manager,
          message.threadId,
          userId,
        ),
      ]);

      this.core.emitMailboxChanged(userId, {
        action: "restored_from_trash",
        messageId,
        threadId: message.threadId,
        folders: this.core.uniqueFolders([
          ...previousFolders,
          ...this.core.getUserMailboxFoldersForMessage(message, userId),
        ]),
      });

      return { data: { messageId, restored: true } };
    } catch (error) {
      this.core.handleError("MailActionService.restoreFromTrash", error);
    }
  }

  async permanentlyDelete(messageId: string, userId: string) {
    try {
      const message = await this.core.messageRepo.findOne({
        where: { id: messageId },
        relations: { recipients: true },
      });

      if (!message) throw new NotFoundException("Message not found");

      const previousFolders = this.core.getUserMailboxFoldersForMessage(
        message,
        userId,
      );

      if (message.senderId === userId && message.senderDeletedAt !== null) {
        const threadId = message.threadId;
        await this.core.messageRepo.delete(messageId);
        await this.core.refreshThreadAfterMutation(
          this.core.dataSource.manager,
          threadId,
        );
        await this.jobsService.enqueueMessageDelete({ messageId });
        this.core.emitMailboxChanged(userId, {
          action: "permanently_deleted",
          messageId,
          threadId,
          folders: this.core.uniqueFolders([...previousFolders, "trash"]),
        });
        return { messageId, status: "permanently_deleted_by_sender" };
      }

      const recipient = message.recipients.find(
        (r) => r.recipientId === userId,
      );
      if (recipient && recipient.isDeleted) {
        await this.core.recipientRepo.remove(recipient);
        await Promise.all([
          this.core.refreshThreadAfterMutation(
            this.core.dataSource.manager,
            message.threadId,
          ),
          this.core.refreshUserThreadState(
            this.core.dataSource.manager,
            message.threadId,
            userId,
          ),
        ]);
        this.core.emitMailboxChanged(userId, {
          action: "permanently_deleted",
          messageId,
          threadId: message.threadId,
          folders: this.core.uniqueFolders([...previousFolders, "trash"]),
        });
        return {
          data: { messageId, status: "permanently_deleted_by_recipient" },
        };
      }

      throw new BadRequestException(
        "Message must be in trash before permanent deletion",
      );
    } catch (error) {
      this.core.handleError("MailActionService.permanentlyDelete", error);
    }
  }

  // ─── Draft delete ─────────────────────────────────────────────────────────

  async deleteDraft(draftId: string, userId: string) {
    try {
      const draft = await this.core.messageRepo.findOne({
        where: { id: draftId, senderId: userId, isDraft: true },
      });

      if (!draft) throw new NotFoundException("Draft not found");

      const threadId = draft.threadId;
      await this.core.messageRepo.delete(draftId);
      await this.core.refreshThreadAfterMutation(
        this.core.dataSource.manager,
        threadId,
      );
      await this.jobsService.enqueueMessageDelete({ messageId: draftId });

      this.core.emitMailboxChanged(userId, {
        action: "draft_deleted",
        messageId: draftId,
        threadId,
        folders: ["drafts"],
      });

      return { messageId: draftId, status: "draft_deleted" };
    } catch (error) {
      this.core.handleError("MailActionService.deleteDraft", error);
    }
  }

  // ─── Empty trash ──────────────────────────────────────────────────────────

  async emptyAllTrash(userId: string) {
    try {
      const recipientRows = await this.core.recipientRepo.find({
        where: { recipientId: userId, isDeleted: true },
      });

      const senderMessages = await this.core.messageRepo.find({
        where: { senderId: userId },
        select: ["id", "threadId", "senderDeletedAt"],
      });

      const recipientMessages = recipientRows.length
        ? await this.core.messageRepo.find({
            where: { id: In(recipientRows.map((r) => r.messageId)) },
            select: ["id", "threadId"],
          })
        : [];

      const affectedThreadIds = [
        ...new Set(
          [
            ...recipientMessages.map((m) => m.threadId),
            ...senderMessages
              .filter((m) => !!m.senderDeletedAt)
              .map((m) => m.threadId),
          ].filter(Boolean),
        ),
      ];

      const result = await this.core.recipientRepo
        .createQueryBuilder()
        .delete()
        .where("recipientId = :userId", { userId })
        .andWhere("isDeleted = true")
        .execute();

      await this.core.messageRepo
        .createQueryBuilder()
        .delete()
        .where("senderId = :userId", { userId })
        .andWhere("senderDeletedAt IS NOT NULL")
        .execute();

      await Promise.all(
        senderMessages
          .filter((m) => !!m.senderDeletedAt)
          .map((m) =>
            this.jobsService.enqueueMessageDelete({ messageId: m.id }),
          ),
      );

      await Promise.all(
        affectedThreadIds.flatMap((threadId) => [
          this.core.refreshUserThreadState(
            this.core.dataSource.manager,
            threadId,
            userId,
          ),
          this.core.refreshThreadAfterMutation(
            this.core.dataSource.manager,
            threadId,
          ),
        ]),
      );

      this.core.emitMailboxChanged(userId, {
        action: "trash_emptied",
        threadIds: affectedThreadIds,
        folders: ["trash"],
      });

      return { data: { success: true, count: result.affected } };
    } catch (error) {
      this.core.handleError("MailActionService.emptyAllTrash", error);
    }
  }

  // ─── Purge expired trash ──────────────────────────────────────────────────

  async purgeExpiredTrash(olderThanDays = 30) {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - olderThanDays);

      const expiredRecipientRows = await this.core.recipientRepo
        .createQueryBuilder("recipient")
        .where("recipient.isDeleted = true")
        .andWhere("recipient.deletedAt IS NOT NULL")
        .andWhere("recipient.deletedAt <= :cutoff", { cutoff })
        .getMany();

      const senderMessages = await this.core.messageRepo
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
        const recipientMessages = await this.core.messageRepo.find({
          where: { id: In(expiredRecipientRows.map((r) => r.messageId)) },
          select: ["id", "threadId"],
        });
        for (const m of recipientMessages) affectedThreadIds.add(m.threadId);
        await this.core.recipientRepo.delete(
          expiredRecipientRows.map((r) => r.id),
        );
      }

      for (const message of senderMessages) {
        affectedThreadIds.add(message.threadId);
        affectedUserIds.add(message.senderId);
      }

      if (senderMessages.length > 0) {
        await this.core.messageRepo.delete(senderMessages.map((m) => m.id));
        await Promise.all(
          senderMessages.map((m) =>
            this.jobsService.enqueueMessageDelete({ messageId: m.id }),
          ),
        );
      }

      const threadIdArray = [...affectedThreadIds];
      const userIdArray = [...affectedUserIds];

      await Promise.all(
        threadIdArray.map((threadId) =>
          this.core.refreshThreadAfterMutation(
            this.core.dataSource.manager,
            threadId,
          ),
        ),
      );

      await Promise.all(
        userIdArray.flatMap((userId) =>
          threadIdArray.map((threadId) =>
            this.core.refreshUserThreadState(
              this.core.dataSource.manager,
              threadId,
              userId,
            ),
          ),
        ),
      );

      return {
        data: {
          success: true,
          recipientDeletes: expiredRecipientRows.length,
          senderDeletes: senderMessages.length,
          olderThanDays,
        },
      };
    } catch (error) {
      this.core.handleError("MailActionService.purgeExpiredTrash", error);
    }
  }
}
