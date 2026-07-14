import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, In, Repository } from "typeorm";
import DOMPurify from "isomorphic-dompurify";
import { SaveDraftDto } from "./dto/save-draft.dto";
import { SendMailDto } from "./dto/send-mail.dto";
import { SendMailResponseDto } from "./dto/response/send-mail.response.dto";
import { RecipientType } from "./entities/message-recipient.entity";
import { Message } from "./entities/message.entity";
import { Thread } from "./entities/thread.entity";
import { Attachment } from "../files/entities/attachment.entity";
import { MailCoreService, RecipientInput } from "./mail-core.service";
import { MailMapper } from "./mappers/mail.mapper";
import { UsersService } from "@modules/users/users.service";
import { JobsService } from "@jobs/jobs.service";

const ALLOWED_SEND_TAGS = [
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
  "hr",
  "span",
  "div",
  "img",
] as const;
const ALLOWED_SEND_ATTR = ["href", "target", "style", "src", "alt", "title", "width", "height", "data-attachment-id"] as const;

@Injectable()
export class ComposeService {
  constructor(
    private readonly core: MailCoreService,
    private readonly dataSource: DataSource,
    @InjectRepository(Attachment)
    private readonly attachmentRepo: Repository<Attachment>,
    private readonly jobsService: JobsService,
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
  ) {}

  // ─── Send ─────────────────────────────────────────────────────────────────

  async send(
    dto: SendMailDto,
    senderEmail: string,
  ): Promise<SendMailResponseDto> {
    try {
      const sender = await this.userService.findByEmail(senderEmail);
      if (!sender) throw new NotFoundException("Sender not found");

      const result = await this.dataSource.transaction(async (manager) => {
        const recipients = await this.buildRecipientInputs(dto, true);
        if (!recipients.length) {
          throw new BadRequestException(
            "No valid recipients were resolved for this message",
          );
        }

        const subject = dto.subject?.trim() ?? "";
        const thread = await this.resolveThread(manager, dto.threadId, subject);
        const sentAt = new Date();

        let message: Message;
        if (dto.draftId) {
          message = await this.findOwnedDraft(manager, dto.draftId, sender.id);
          message.threadId = thread.id;
          message.subject = dto.subject ?? message.subject;
          message.body = dto.body;
          message.bodyHtml = DOMPurify.sanitize(
            dto.bodyHtml ?? `<p>${dto.body.replace(/\n/g, "<br>")}</p>`,
            {
              ALLOWED_TAGS: [...ALLOWED_SEND_TAGS],
              ALLOWED_ATTR: [...ALLOWED_SEND_ATTR],
            },
          );
          message.isDraft = false;
          message.sentAt = sentAt;
          message.senderDeletedAt = null;
        } else {
          message = manager.create(Message, {
            threadId: thread.id,
            senderId: sender.id,
            subject,
            body: dto.body,
            bodyHtml: DOMPurify.sanitize(
              dto.bodyHtml ?? `<p>${dto.body.replace(/\n/g, "<br>")}</p>`,
              {
                ALLOWED_TAGS: [...ALLOWED_SEND_TAGS],
                ALLOWED_ATTR: [...ALLOWED_SEND_ATTR],
              },
            ),
            isDraft: false,
            sentAt,
          });
        }

        const saved = await manager.save(message);

        await this.core.replaceRecipients(manager, saved.id, recipients);

        if (dto.attachmentIds?.length) {
          await this.attachFiles(
            manager,
            saved.id,
            sender.id,
            dto.attachmentIds,
          );
        }

        if (subject) {
          await this.updateThreadSubject(manager, thread, subject);
        }

        await this.core.refreshThreadAfterMutation(manager, thread.id, subject);

        return {
          id: saved.id,
          threadId: thread.id,
          sentAt,
          recipientIds: recipients.map((r) => r.recipientId),
        };
      });

      await Promise.all([
        this.jobsService.enqueueMailDelivery({ messageId: result.id }),
        this.jobsService.enqueueMessageIndex({ messageId: result.id }),
      ]);

      const response = MailMapper.toSendMailResponse(result);

      this.core.emitMailboxChanged(sender.id, {
        action: "message_sent",
        messageId: response.messageId,
        threadId: response.threadId,
        folders: dto.draftId ? ["sent", "drafts"] : ["sent"],
      });

      for (const recipientId of result.recipientIds) {
        this.core.emitMailboxChanged(recipientId, {
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
      this.core.handleError("ComposeService.send", error);
    }
  }

  // ─── Save Draft ───────────────────────────────────────────────────────────

  async saveDraft(dto: SaveDraftDto, senderId: string) {
    try {
      const draft = await this.dataSource.transaction(async (manager) => {
        const subject = dto.subject?.trim() ?? "";
        const thread = await this.resolveThread(manager, dto.threadId, subject);

        let draft: Message;
        if (dto.draftId) {
          draft = await this.findOwnedDraft(manager, dto.draftId, senderId);
          draft.threadId = thread.id;
          draft.subject = dto.subject ?? draft.subject;
          draft.body = dto.body ?? draft.body ?? "";
          draft.bodyHtml = DOMPurify.sanitize(dto.bodyHtml, {
            ALLOWED_TAGS: [...ALLOWED_SEND_TAGS],
            ALLOWED_ATTR: [...ALLOWED_SEND_ATTR],
          });
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
              ? DOMPurify.sanitize(dto.bodyHtml, {
                  ALLOWED_TAGS: [...ALLOWED_SEND_TAGS],
                  ALLOWED_ATTR: [...ALLOWED_SEND_ATTR],
                })
              : generatedHtml,
            isDraft: true,
            sentAt: null,
          });
        }

        const savedDraft = await manager.save(draft);

        if (this.includesRecipientUpdate(dto)) {
          const recipients = await this.buildRecipientInputs(dto, false);
          await this.core.replaceRecipients(manager, savedDraft.id, recipients);
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

        await this.core.refreshThreadMetadata(manager, thread.id, subject);
        return await this.core.getMessageOrFail(manager, savedDraft.id);
      });

      this.core.emitMailboxChanged(senderId, {
        action: "draft_saved",
        messageId: draft.id,
        threadId: draft.threadId,
        folders: ["drafts"],
      });

      return draft;
    } catch (error) {
      this.core.handleError("ComposeService.saveDraft", error);
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async resolveThread(
    manager: EntityManager,
    threadId?: string,
    subject?: string,
  ): Promise<Thread> {
    if (threadId) {
      const thread = await manager.findOne(Thread, { where: { id: threadId } });
      if (!thread) throw new NotFoundException("Thread not found");
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
    dto: Partial<
      Pick<SendMailDto, "toEmails" | "ccEmails" | "bccEmails"> &
        Pick<SaveDraftDto, "toEmails" | "ccEmails" | "bccEmails">
    >,
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

    if (!rawRecipients.length) return [];

    const distinctEmails = [...new Set(rawRecipients.map((r) => r.email))];
    const users = await this.core.userRepo.find({
      where: { email: In(distinctEmails), isActive: true },
      select: ["id", "email"],
    });

    if (users.length !== distinctEmails.length) {
      const missingCount = distinctEmails.length - users.length;
      this.core.logger.log(
        `${missingCount} recipient(s) not found as internal users — will be treated as external recipients`,
      );
    }

    const emailToIdMap = new Map(users.map((user) => [user.email, user.id]));
    return this.core.dedupeRecipients(
      rawRecipients.map((r) => {
        const recipientId = emailToIdMap.get(r.email) ?? null;
        return recipientId
          ? { recipientId, type: r.type as RecipientType }
          : {
              recipientId: null,
              type: r.type as RecipientType,
              externalEmail: r.email,
            };
      }),
    );
  }

  private async attachFiles(
    manager: EntityManager,
    messageId: string,
    senderId: string,
    attachmentIds?: string[],
  ) {
    if (!attachmentIds?.length) return;

    const attachments = await manager.find(Attachment, {
      where: { id: In(attachmentIds), uploaderId: senderId },
    });

    if (attachments.length !== attachmentIds.length) {
      throw new BadRequestException("One or more attachments are invalid");
    }

    const MAX_TOTAL_SIZE = 20 * 1024 * 1024;
    const totalSize = attachments.reduce(
      (sum, a) => sum + Number(a.sizeBytes),
      0,
    );
    if (totalSize > MAX_TOTAL_SIZE) {
      throw new BadRequestException("Total attachment size exceeds 20MB limit");
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
      where: { id: draftId, senderId, isDraft: true },
    });
    if (!draft) throw new NotFoundException("Draft not found");
    return draft;
  }

  private includesRecipientUpdate(dto: SaveDraftDto): boolean {
    return (
      Object.prototype.hasOwnProperty.call(dto, "toEmails") ||
      Object.prototype.hasOwnProperty.call(dto, "ccEmails") ||
      Object.prototype.hasOwnProperty.call(dto, "bccEmails")
    );
  }
}
