import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";

// TODO: Process 'notifications' queue jobs
// Job names: 'announcement'
// Steps:
//   announcement → for each targeted userId: NotificationsService.create(userId, 'announcement', ...)
//                  then MailGateway.emitNotification(userId, payload)

@Processor("notifications")
export class NotificationProcessor extends WorkerHost {
  async process(job: Job): Promise<void> {
    // TODO: Implement switch on job.name
    try {
      console.log(job);
    } catch (error) {
      console.error("Error processing notification job:", error);
    }
  }
}
