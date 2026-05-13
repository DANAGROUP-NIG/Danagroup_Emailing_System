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
import { Message } from "../modules/mail/entities/message.entity";
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
      const senderName = [message.sender?.firstName, message.sender?.lastName]
        .filter(Boolean)
        .join(" ");

      const payload: NotificationDispatchJobData = {
        userId: recipient.recipientId,
        type: "new_mail",
        title: `New mail from ${senderName || message.sender?.email || "Unknown sender"}`,
        body: message.subject,
        referenceId: message.id,
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
