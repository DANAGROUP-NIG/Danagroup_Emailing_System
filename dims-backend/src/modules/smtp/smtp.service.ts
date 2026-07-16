import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type { Transporter, SendMailOptions } from "nodemailer";

export interface SmtpSendOptions {
  from: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
  }>;
  headers?: Record<string, string>;
}

@Injectable()
export class SmtpService implements OnModuleInit {
  private readonly logger = new Logger(SmtpService.name);
  private transporter: Transporter | null = null;
  private enabled = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>("SMTP_HOST");
    if (!host) {
      this.logger.warn(
        "SMTP_HOST not configured — external email delivery disabled. " +
          "Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS to enable.",
      );
      return;
    }

    const port = parseInt(
      this.configService.get<string>("SMTP_PORT") ?? "587",
      10,
    );
    const user = this.configService.get<string>("SMTP_USER");
    const pass = this.configService.get<string>("SMTP_PASS");
    const secure = port === 465;

    const isInternalRelay = ["postfix", "localhost", "127.0.0.1"].includes(
      host.toLowerCase(),
    );

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      tls: {
        rejectUnauthorized: !isInternalRelay,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    this.enabled = true;
    this.logger.log(`SMTP configured → ${host}:${port} (secure=${secure})`);
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  get fromAddress(): string {
    return (
      this.configService.get<string>("SMTP_FROM") ??
      `noreply@${this.configService.get<string>("MAIL_DOMAIN") ?? "danagroup.net"}`
    );
  }

  async sendMail(options: SmtpSendOptions): Promise<boolean> {
    if (!this.enabled || !this.transporter) {
      this.logger.debug(
        `SMTP disabled — skipping external delivery to ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`,
      );
      return false;
    }

    const mailOptions = {
      ...(options as SendMailOptions),
      headers: {
        ...(options.headers || {}),
        "X-SMTPAPI": '{"filters": {"clicktrack": {"settings": {"enable": 0}}}}',
      },
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent to ${Array.isArray(options.to) ? options.to.join(", ") : options.to} — messageId: ${info.messageId}`,
      );
      return true;
    } catch (err) {
      this.logger.error(
        `Failed to send email to ${Array.isArray(options.to) ? options.to.join(", ") : options.to}: ${(err as Error).message}`,
      );
      return false;
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) return false;
    try {
      await this.transporter.verify();
      return true;
    } catch (err) {
      this.logger.error(
        `SMTP connection verification failed: ${(err as Error).message}`,
      );
      return false;
    }
  }
}
