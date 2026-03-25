import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";

// TODO: Process 'mail-delivery' queue jobs
// Job data: { messageId, recipientIds, senderId }
// Steps:
//   1. Fetch message from DB
//   2. For each recipientId: create Notification record via NotificationsService
//   3. Emit WebSocket event via MailGateway.emitNewMail(recipientId, messagePayload)
//   4. Optionally: send push notification (future)

@Processor("mail-delivery")
export class MailDeliveryProcessor extends WorkerHost {
  async process(job: Job): Promise<void> {
    // TODO: Implement based on job.name
    // job.name === 'deliver' → deliver notifications to all recipients
  }
}
