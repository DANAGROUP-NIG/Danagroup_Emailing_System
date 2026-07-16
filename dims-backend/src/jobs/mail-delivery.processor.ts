import {
  InjectQueue,
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Job, Queue } from "bullmq";
import { Repository } from "typeorm";
import { MessageRecipient } from "../modules/mail/entities/message-recipient.entity";
import { MailRulesService } from "../modules/mail-rules/mail-rules.service";
import { SmtpService } from "../modules/smtp/smtp.service";
import { StorageService } from "../modules/storage/storage.service";
import { Message } from "../modules/mail/entities/message.entity";
import { buildRawEmail } from "../modules/mail/utils/build-raw-email";
import { MaildirSyncService } from "../modules/mail/maildir-sync.service";
import {
  MailDeliveryJobData,
  NotificationDispatchJobData,
} from "./job-payloads";
import { validateJobPayload } from "./job-validation";
import {
  MAIL_DELIVERY_JOBS,
  NOTIFICATION_JOBS,
  QUEUES,
} from "./queue.constants";

@Injectable()
@Processor(QUEUES.MAIL_DELIVERY)
export class MailDeliveryProcessor extends WorkerHost {
  private readonly logger = new Logger(MailDeliveryProcessor.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(MessageRecipient)
    private readonly recipientRepo: Repository<MessageRecipient>,
    @InjectQueue(QUEUES.NOTIFICATIONS)
    private readonly notificationsQueue: Queue,
    private readonly mailRulesService: MailRulesService,
    private readonly smtpService: SmtpService,
    private readonly storageService: StorageService,
    private readonly maildirSyncService: MaildirSyncService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case MAIL_DELIVERY_JOBS.DELIVER:
        await this.handleDelivery(job);
        return;
      default:
        this.logger.warn(`Skipping unsupported mail job: ${job.name}`);
    }
  }

  private async applyRules(
    recipient: MessageRecipient,
    message: Message,
  ): Promise<void> {
    try {
      const rules = await this.mailRulesService.getActiveRulesForUser(
        recipient.recipientId,
      );
      if (!rules.length) return;

      const actions = this.mailRulesService.evaluateRules(rules, {
        subject: message.subject ?? "",
        body: message.body ?? "",
        senderEmail: message.sender?.email ?? "",
      });

      if (!actions.size) return;

      const updates: Partial<MessageRecipient> = {};
      if (actions.has("star")) updates.isStarred = true;
      if (actions.has("archive")) updates.isArchived = true;
      if (actions.has("trash")) updates.isDeleted = true;
      if (actions.has("mark_read")) {
        updates.isRead = true;
        updates.readAt = new Date();
      }

      if (Object.keys(updates).length) {
        await this.recipientRepo.update(recipient.id, updates);
      }
    } catch (err) {
      this.logger.error(
        `Failed to apply mail rules for recipient ${recipient.recipientId}: ${(err as Error).message}`,
      );
    }
  }

  private async sendExternal(toEmail: string, message: Message): Promise<void> {
    const senderName = [message.sender?.firstName, message.sender?.lastName]
      .filter(Boolean)
      .join(" ");

    const fromEmail = message.sender?.email ?? this.smtpService.fromAddress;
    const fromAddress = senderName
      ? `"${senderName}" <${fromEmail}>`
      : fromEmail;

    // Build Nodemailer attachments from message attachments stored in MinIO
    const nodemailerAttachments: Array<{
      filename: string;
      content: Buffer;
      contentType: string;
    }> = [];

    if (message.attachments?.length) {
      this.logger.log(
        `Loading ${message.attachments.length} attachment(s) for external delivery to ${toEmail}`,
      );

      for (const att of message.attachments) {
        try {
          const stream = await this.storageService.getObjectStream(
            att.storageKey,
          );

          // Collect stream into buffer for Nodemailer
          const chunks: Buffer[] = [];
          for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          const buffer = Buffer.concat(chunks);

          nodemailerAttachments.push({
            filename: att.filename,
            content: buffer,
            contentType: att.mime_type,
          });
        } catch (err) {
          this.logger.error(
            `Failed to load attachment "${att.filename}" (${att.storageKey}) for external delivery: ${(err as Error).message}`,
          );
          // Continue with other attachments — don't fail the entire send
        }
      }
    }

    const sent = await this.smtpService.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: message.subject ?? "(no subject)",
      text: message.body ?? "",
      html: message.bodyHtml ?? undefined,
      attachments: nodemailerAttachments.length
        ? nodemailerAttachments
        : undefined,
    });

    if (!sent) {
      this.logger.warn(
        `External delivery to ${toEmail} skipped (SMTP not configured or failed)`,
      );

      // Generate NDR
      try {
        const ndrSubject = `Undelivered Mail Returned to Sender`;
        const ndrBodyText = `This is the mail system at danagroup.net.

I'm sorry to have to inform you that your message could not be delivered to one or more recipients.

<${toEmail}>: Delivery failed or recipient rejected.

--- Original Message ---
Subject: ${message.subject}
Date: ${message.sentAt || message.createdAt}
`;

        const ndrMessage = this.messageRepo.create({
          threadId: message.threadId,
          senderId: message.senderId,
          subject: ndrSubject,
          body: ndrBodyText,
          bodyHtml: `<p>This is the mail system at danagroup.net.</p><p>I'm sorry to have to inform you that your message could not be delivered to one or more recipients.</p><p><strong>&lt;${toEmail}&gt;</strong>: Delivery failed or recipient rejected.</p><hr><p>Original Subject: ${message.subject}</p>`,
          isDraft: false,
          sentAt: new Date(),
          isInbound: true,
          externalSenderEmail: "mailer-daemon@danagroup.net",
          externalSenderName: "Mail Delivery Subsystem",
        });

        const savedNdr = await this.messageRepo.save(ndrMessage);

        const ndrRecipient = this.recipientRepo.create({
          messageId: savedNdr.id,
          recipientId: message.senderId,
          type: "to",
          externalEmail: null,
        });
        await this.recipientRepo.save(ndrRecipient);

        const payload: NotificationDispatchJobData = {
          userId: message.senderId,
          type: "new_mail",
          title: `Delivery Failed: ${toEmail}`,
          body: ndrSubject,
          referenceId: message.threadId,
          eventPayload: {
            event: "new_mail",
            data: {
              action: "message_received",
              messageId: savedNdr.id,
              threadId: message.threadId,
              folders: ["inbox"],
              subject: ndrSubject,
              sender: {
                id: "external",
                email: "mailer-daemon@danagroup.net",
                firstName: "Mail Delivery Subsystem",
                lastName: "",
              },
              recipient: {
                id: message.senderId,
                email: message.sender?.email,
              },
              sentAt: savedNdr.sentAt,
            },
          },
        };

        await this.notificationsQueue.add(NOTIFICATION_JOBS.DISPATCH, payload, {
          attempts: 5,
          backoff: { type: "exponential", delay: 5000 },
        });
      } catch (err) {
        this.logger.error(
          `Failed to generate NDR for ${toEmail}: ${(err as Error).message}`,
        );
      }
    }

    // Build and persist raw RFC 2822 for IMAP serving (if not already stored)
    if (!message.rawEmail) {
      try {
        const raw = await buildRawEmail({
          from: fromAddress,
          to: [toEmail],
          subject: message.subject ?? "(no subject)",
          text: message.body ?? "",
          html: message.bodyHtml ?? undefined,
          date: message.sentAt ?? message.createdAt,
        });
        await this.messageRepo.update(message.id, { rawEmail: raw });
        // Sync into sender's Maildir .Sent folder for IMAP access
        const senderEmail = message.sender?.email;
        if (senderEmail) {
          await this.maildirSyncService.syncSent(raw, senderEmail, message.id);
        }
      } catch (err) {
        this.logger.warn(
          `Failed to build rawEmail for IMAP (message ${message.id}): ${(err as Error).message}`,
        );
      }
    }
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job) {
    this.logger.debug(`Mail job completed: ${job.name} (${job.id})`);
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Mail job failed: ${job?.name ?? "unknown"} (${job?.id ?? "n/a"})`,
      error?.stack,
    );
  }

  private async handleDelivery(job: Job) {
    const { messageId } = validateJobPayload(MailDeliveryJobData, job.data);

    const message = await this.messageRepo.findOne({
      where: { id: messageId },
      relations: {
        sender: true,
        attachments: true,
      },
    });

    if (!message) {
      this.logger.warn(`Message ${messageId} not found for delivery`);
      return;
    }

    const recipients = await this.recipientRepo.find({
      where: {
        messageId,
        isDeleted: false,
      },
      relations: {
        recipient: true,
      },
    });

    for (const recipient of recipients) {
      // External recipient: deliver via SMTP
      if (recipient.externalEmail) {
        await this.sendExternal(recipient.externalEmail, message);
        continue;
      }

      // Apply mail rules for this recipient
      await this.applyRules(recipient, message);

      const senderName = [message.sender?.firstName, message.sender?.lastName]
        .filter(Boolean)
        .join(" ");

      const payload: NotificationDispatchJobData = {
        userId: recipient.recipientId,
        type: "new_mail",
        title: `New mail from ${senderName || message.sender?.email || "Unknown sender"}`,
        body: message.subject,
        referenceId: message.threadId,
        eventPayload: {
          event: "new_mail",
          data: {
            action: "message_received",
            messageId: message.id,
            threadId: message.threadId,
            folders: ["inbox"],
            subject: message.subject,
            sender: {
              id: message.senderId,
              email: message.sender?.email,
              firstName: message.sender?.firstName,
              lastName: message.sender?.lastName,
            },
            recipient: {
              id: recipient.recipientId,
              email: recipient.recipient?.email,
            },
            sentAt: message.sentAt ?? message.createdAt,
          },
        },
      };

      await this.notificationsQueue.add(NOTIFICATION_JOBS.DISPATCH, payload, {
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      });
    }
  }
}
