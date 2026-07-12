import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as fs from "fs/promises";
import * as path from "path";
import { Message } from "./entities/message.entity";
import { MessageRecipient } from "./entities/message-recipient.entity";
import { User } from "@modules/users/entities/user.entity";

/**
 * MaildirSyncService — mirrors DIMS messages into Maildir on disk so that
 * Dovecot can serve them over IMAP/POP3.
 *
 * Layout: MAILDIR_ROOT/<domain>/<localpart>/{cur,new,tmp}/
 *   INBOX  → new unread messages delivered to recipient
 *   .Sent  → messages sent by the user
 *   .Drafts → draft messages
 *   .Trash → deleted messages
 */
@Injectable()
export class MaildirSyncService implements OnModuleInit {
  private readonly logger = new Logger(MaildirSyncService.name);
  private readonly root: string;
  private readonly domain: string;
  private enabled = false;

  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(MessageRecipient)
    private readonly recipientRepo: Repository<MessageRecipient>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    this.root = process.env.MAILDIR_ROOT ?? "";
    this.domain = process.env.MAIL_DOMAIN ?? "danagroup.net";
  }

  async onModuleInit() {
    if (!this.root) {
      this.logger.warn(
        "MAILDIR_ROOT not set — Dovecot IMAP sync disabled. " +
          "Set MAILDIR_ROOT to enable IMAP access.",
      );
      return;
    }
    this.enabled = true;
    this.logger.log(
      `Maildir sync enabled — root: ${this.root}, domain: ${this.domain}`,
    );
  }

  /**
   * Write a message into the recipient's Maildir INBOX (new mail).
   * Called by InboundMailService after saving inbound email.
   */
  async syncInbound(
    rawEmail: string,
    recipientEmail: string,
    messageId: string,
  ): Promise<void> {
    if (!this.enabled) return;
    try {
      const folder = await this.ensureMaildir(recipientEmail, "");
      await this.writeToMaildir(folder, rawEmail, messageId, false);
      this.logger.log(
        `Maildir sync: inbound → ${recipientEmail} INBOX (msg ${messageId})`,
      );
    } catch (err) {
      this.logger.error(
        `Maildir sync failed for inbound to ${recipientEmail}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Write a sent message into the sender's Maildir .Sent folder.
   * Called by MailDeliveryProcessor after sending.
   */
  async syncSent(
    rawEmail: string,
    senderEmail: string,
    messageId: string,
  ): Promise<void> {
    if (!this.enabled) return;
    try {
      const folder = await this.ensureMaildir(senderEmail, ".Sent");
      await this.writeToMaildir(folder, rawEmail, messageId, true);
      this.logger.log(
        `Maildir sync: sent → ${senderEmail} .Sent (msg ${messageId})`,
      );
    } catch (err) {
      this.logger.error(
        `Maildir sync failed for sent by ${senderEmail}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Write a draft into the sender's Maildir .Drafts folder.
   */
  async syncDraft(
    rawEmail: string,
    senderEmail: string,
    messageId: string,
  ): Promise<void> {
    if (!this.enabled) return;
    try {
      const folder = await this.ensureMaildir(senderEmail, ".Drafts");
      await this.writeToMaildir(folder, rawEmail, messageId, true);
    } catch (err) {
      this.logger.error(
        `Maildir draft sync failed for ${senderEmail}: ${(err as Error).message}`,
      );
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private userDir(email: string): string {
    const [localpart, domain] = email.split("@");
    return path.join(this.root, domain ?? this.domain, localpart ?? email);
  }

  private async ensureMaildir(
    email: string,
    subfolder: string,
  ): Promise<string> {
    const base = path.join(this.userDir(email), subfolder);
    await fs.mkdir(path.join(base, "cur"), { recursive: true });
    await fs.mkdir(path.join(base, "new"), { recursive: true });
    await fs.mkdir(path.join(base, "tmp"), { recursive: true });
    return base;
  }

  /**
   * Write RFC 2822 content to a Maildir file.
   * read=true  → write to cur/ with :2,S flag (Seen)
   * read=false → write to new/ (unread, triggers new-mail notifications in clients)
   */
  private async writeToMaildir(
    maildirFolder: string,
    content: string,
    messageId: string,
    read: boolean,
  ): Promise<void> {
    const unique = `${Date.now()}.${process.pid}.${messageId.slice(0, 8)}`;
    const filename = read ? `${unique}:2,S` : unique;
    const subdir = read ? "cur" : "new";
    const filepath = path.join(maildirFolder, subdir, filename);

    // Write to tmp first, then rename (atomic Maildir delivery)
    const tmpPath = path.join(maildirFolder, "tmp", unique);
    await fs.writeFile(tmpPath, content, "utf8");
    await fs.rename(tmpPath, filepath);
  }
}
