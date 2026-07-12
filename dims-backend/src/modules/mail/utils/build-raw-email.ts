import * as nodemailer from "nodemailer";
import type { Readable } from "stream";

export interface RawEmailOptions {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  messageId?: string;
  date?: Date;
  inReplyTo?: string;
  references?: string;
}

/**
 * Builds a standards-compliant RFC 2822 email string using Nodemailer's
 * internal message builder (without actually sending). Used to populate
 * messages.raw_email for IMAP/POP3 serving via Dovecot.
 */
export async function buildRawEmail(
  options: RawEmailOptions,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const mail = nodemailer.createTransport({ streamTransport: true });

    const message: Record<string, unknown> = {
      from: options.from,
      to: options.to.join(", "),
      subject: options.subject,
      date: options.date ?? new Date(),
      messageId: options.messageId,
    };

    if (options.cc?.length) message.cc = options.cc.join(", ");
    if (options.bcc?.length) message.bcc = options.bcc.join(", ");
    if (options.text) message.text = options.text;
    if (options.html) message.html = options.html;
    if (options.inReplyTo) message.inReplyTo = options.inReplyTo;
    if (options.references) message.references = options.references;

    mail.sendMail(message as Parameters<typeof mail.sendMail>[0], (err, info) => {
      if (err) return reject(err);
      const stream = info.message as Readable;
      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      stream.on("error", reject);
    });
  });
}
