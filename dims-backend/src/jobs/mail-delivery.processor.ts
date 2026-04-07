import { Processor, WorkerHost } from "@nestjs/bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import { Job } from "bullmq";
import { Repository } from "typeorm";
import { MessageRecipient } from "../modules/mail/entities/message-recipient.entity";
import { Message } from "../modules/mail/entities/message.entity";
import { NotificationsService } from "../modules/notifications/notifications.service";

@Processor("mail-delivery")
export class MailDeliveryProcessor extends WorkerHost {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(MessageRecipient)
    private readonly recipientRepo: Repository<MessageRecipient>,
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== "deliver") {
      return;
    }

    const { messageId } = job.data as { messageId: string };

    const message = await this.messageRepo.findOne({
      where: { id: messageId },
      relations: {
        sender: true,
      },
    });

    if (!message) {
      return;
    }

    const recipients = await this.recipientRepo.find({
      where: {
        message_id: messageId,
      },
    });

    for (const recipient of recipients) {
      const senderName = [message.sender?.firstName, message.sender?.lastName]
        .filter(Boolean)
        .join(" ");

      await this.notificationsService.create(
        recipient.recipient_id,
        "new_mail",
        `New mail from ${senderName || "Unknown sender"}`,
        message.subject,
        message.id,
      );
    }
  }
}
