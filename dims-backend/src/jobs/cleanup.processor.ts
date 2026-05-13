import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { MailService } from "../modules/mail/mail.service";
import { CleanupTrashJobData } from "./job-payloads";
import { validateJobPayload } from "./job-validation";
import { CLEANUP_JOBS, QUEUES } from "./queue.constants";

@Injectable()
@Processor(QUEUES.CLEANUP)
export class CleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case CLEANUP_JOBS.PURGE_TRASH:
        await this.purgeTrash(job);
        return;
      default:
        this.logger.warn(`Skipping unsupported cleanup job: ${job.name}`);
    }
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job) {
    this.logger.debug(`Cleanup job completed: ${job.name} (${job.id})`);
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Cleanup job failed: ${job?.name ?? "unknown"} (${job?.id ?? "n/a"})`,
      error?.stack,
    );
  }

  private async purgeTrash(job: Job) {
    const payload = validateJobPayload(CleanupTrashJobData, job.data ?? {});
    await this.mailService.purgeExpiredTrash(payload.olderThanDays);
  }
}
