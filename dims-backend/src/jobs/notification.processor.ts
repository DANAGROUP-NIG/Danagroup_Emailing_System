import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { MailGateway } from "../modules/mail/mail.gateway";
import { NotificationsService } from "../modules/notifications/notifications.service";
import {
  AnnouncementNotificationJobData,
  NotificationDispatchJobData,
} from "./job-payloads";
import { validateJobPayload } from "./job-validation";
import { NOTIFICATION_JOBS, QUEUES } from "./queue.constants";

@Injectable()
@Processor(QUEUES.NOTIFICATIONS)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly mailGateway: MailGateway,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case NOTIFICATION_JOBS.DISPATCH:
        await this.dispatchNotification(job);
        return;
      case NOTIFICATION_JOBS.ANNOUNCEMENT:
        await this.dispatchAnnouncement(job);
        return;
      default:
        this.logger.warn(`Skipping unsupported notification job: ${job.name}`);
    }
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job) {
    this.logger.debug(`Notification job completed: ${job.name} (${job.id})`);
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Notification job failed: ${job?.name ?? "unknown"} (${job?.id ?? "n/a"})`,
      error?.stack,
    );
  }

  private async dispatchNotification(job: Job) {
    const payload = validateJobPayload(NotificationDispatchJobData, job.data);
    const notification = await this.notificationsService.create(
      payload.userId,
      payload.type,
      payload.title,
      payload.body,
      payload.referenceId,
    );

    const eventName = payload.eventPayload?.event || payload.type;
    const eventData = {
      notificationId: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      referenceId: notification.referenceId,
      createdAt: notification.createdAt,
      ...(payload.eventPayload?.data ?? {}),
    };

    this.mailGateway.emitEventToUser(payload.userId, eventName, eventData);
    this.mailGateway.emitNotification(payload.userId, eventData);
  }

  private async dispatchAnnouncement(job: Job) {
    const payload = validateJobPayload(
      AnnouncementNotificationJobData,
      job.data,
    );

    for (const userId of payload.userIds) {
      const notification = await this.notificationsService.create(
        userId,
        "announcement",
        payload.title,
        payload.body,
        payload.referenceId,
      );

      const eventData = {
        notificationId: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        referenceId: notification.referenceId,
        createdAt: notification.createdAt,
      };

      this.mailGateway.emitAnnouncement(userId, eventData);
      this.mailGateway.emitNotification(userId, eventData);
    }
  }
}
