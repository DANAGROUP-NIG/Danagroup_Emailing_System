import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { simpleParser, type AddressObject } from "mailparser";
import { Message } from "./entities/message.entity";
import { Thread } from "./entities/thread.entity";
import { MessageRecipient } from "./entities/message-recipient.entity";
import { Attachment } from "@modules/files/entities/attachment.entity";
import { User } from "@modules/users/entities/user.entity";
import { NotificationsService } from "@modules/notifications/notifications.service";
import { StorageService } from "@modules/storage/storage.service";
import type { RecipientType } from "./entities/message-recipient.entity";

@Injectable()
export class InboundMailService {
  private readonly logger = new Logger(InboundMailService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Thread)
    private readonly threadRepo: Repository<Thread>,
    @InjectRepository(MessageRecipient)
    private readonly recipientRepo: Repository<MessageRecipient>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
    private readonly storageService: StorageService,
  ) {}

  async processRaw(rawEmail: Buffer | string): Promise<void> {
    const parsed = await simpleParser(rawEmail);

    const fromAddress = this.extractFirstAddress(parsed.from);
    const fromName = this.extractFirstName(parsed.from);
    const subject = parsed.subject ?? "(no subject)";
    const bodyText = parsed.text ?? "";
    const bodyHtml = parsed.html || undefined;

    if (!fromAddress) {
      this.logger.warn("Inbound email has no From address — skipping");
      return;
    }

    // Collect all recipient emails
    const toAddresses = this.extractAddresses(parsed.to);
    const ccAddresses = this.extractAddresses(parsed.cc);
    const bccAddresses = this.extractAddresses(parsed.bcc);

    const allRecipientEmails = [
      ...toAddresses,
      ...ccAddresses,
      ...bccAddresses,
    ];

    if (!allRecipientEmails.length) {
      this.logger.warn("Inbound email has no recipients — skipping");
      return;
    }

    // Resolve which recipient emails match internal users
    const internalUsers = await this.userRepo.find({
      where: { email: In(allRecipientEmails), isActive: true },
      select: ["id", "email"],
    });

    if (!internalUsers.length) {
      this.logger.warn(
        `Inbound email from ${fromAddress} has no matching internal recipients — skipping`,
      );
      return;
    }

    const emailToUser = new Map(internalUsers.map((u) => [u.email, u]));

    await this.dataSource.transaction(async (manager) => {
      // Find or create thread (match by subject for simplicity; In-Reply-To header would be better)
      let thread = await manager.findOne(Thread, {
        where: { subject: subject.toLowerCase().trim() },
      });

      if (!thread) {
        thread = manager.create(Thread, {
          subject: subject.toLowerCase().trim(),
          lastActivityAt: new Date(),
          lastMessageAt: new Date(),
          snippet: bodyText.slice(0, 140),
        });
        thread = await manager.save(thread);
      }

      // Create the message — senderId is null for inbound external mail
      // Use a system/placeholder approach: find internal recipient as "owner"
      const primaryRecipient = internalUsers[0];

      const message = manager.create(Message, {
        threadId: thread.id,
        senderId: primaryRecipient.id, // temporary placeholder; real sender is externalSenderEmail
        subject,
        body: bodyText,
        bodyHtml: bodyHtml ?? bodyText,
        isDraft: false,
        sentAt: parsed.date ?? new Date(),
        isInbound: true,
        externalSenderEmail: fromAddress,
        externalSenderName: fromName,
      });

      const savedMessage = await manager.save(message);

      // ─── Save inbound attachments ──────────────────────────────────────
      if (parsed.attachments?.length) {
        this.logger.log(
          `Processing ${parsed.attachments.length} attachment(s) from inbound email`,
        );

        for (const att of parsed.attachments) {
          try {
            const filename = att.filename || "unnamed-attachment";
            const mimeType = att.contentType || "application/octet-stream";
            const buffer = att.content;

            // Upload to MinIO
            const uploadResult = await this.storageService.uploadBuffer(
              buffer,
              buffer.length,
              mimeType,
              {
                folder: "attachments",
                filename,
              },
            );

            // Create Attachment entity linked to the saved message
            const attachment = manager.create(Attachment, {
              uploaderId: primaryRecipient.id,
              filename,
              mime_type: mimeType,
              sizeBytes: buffer.length,
              storageKey: uploadResult.storageKey,
              messageId: savedMessage.id,
            });

            await manager.save(attachment);

            this.logger.log(
              `Saved inbound attachment: ${filename} (${buffer.length} bytes) → ${uploadResult.storageKey}`,
            );
          } catch (err) {
            this.logger.error(
              `Failed to save inbound attachment "${att.filename}": ${(err as Error).message}`,
            );
            // Continue processing other attachments — don't fail the whole email
          }
        }
      }

      // Create recipient rows for all internal users who received this
      const recipientEntities: MessageRecipient[] = [];

      const addRecipients = (emails: string[], type: RecipientType) => {
        for (const email of emails) {
          const user = emailToUser.get(email);
          if (user) {
            recipientEntities.push(
              manager.create(MessageRecipient, {
                messageId: savedMessage.id,
                recipientId: user.id,
                type,
                externalEmail: null,
              }),
            );
          }
        }
      };

      addRecipients(toAddresses, "to");
      addRecipients(ccAddresses, "cc");
      addRecipients(bccAddresses, "bcc");

      await manager.save(recipientEntities);

      // Update thread metadata
      thread.lastActivityAt = savedMessage.sentAt;
      thread.lastMessageAt = savedMessage.sentAt;
      thread.snippet = bodyText.slice(0, 140);
      await manager.save(thread);

      this.logger.log(
        `Inbound email from ${fromAddress} → ${internalUsers.length} internal recipient(s), messageId=${savedMessage.id}, attachments=${parsed.attachments?.length ?? 0}`,
      );
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private extractFirstAddress(
    addr: AddressObject | AddressObject[] | undefined,
  ): string | null {
    if (!addr) return null;
    const obj = Array.isArray(addr) ? addr[0] : addr;
    return obj?.value?.[0]?.address?.toLowerCase() ?? null;
  }

  private extractFirstName(
    addr: AddressObject | AddressObject[] | undefined,
  ): string | null {
    if (!addr) return null;
    const obj = Array.isArray(addr) ? addr[0] : addr;
    return obj?.value?.[0]?.name || null;
  }

  private extractAddresses(
    addr: AddressObject | AddressObject[] | undefined,
  ): string[] {
    if (!addr) return [];
    const objs = Array.isArray(addr) ? addr : [addr];
    return objs
      .flatMap((o) => o.value ?? [])
      .map((a) => a.address?.toLowerCase())
      .filter((e): e is string => !!e);
  }
}
