import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Job } from "bullmq";
import { Repository } from "typeorm";
import { Message } from "../modules/mail/entities/message.entity";
import { SearchService } from "../modules/search/search.service";
import { User } from "../modules/users/entities/user.entity";
import {
  DeleteMessageJobData,
  DeleteUserJobData,
  IndexMessageJobData,
  IndexUserJobData,
} from "./job-payloads";
import { validateJobPayload } from "./job-validation";
import { QUEUES, SEARCH_INDEXER_JOBS } from "./queue.constants";

@Injectable()
@Processor(QUEUES.SEARCH_INDEXER)
export class SearchIndexerProcessor extends WorkerHost {
  private readonly logger = new Logger(SearchIndexerProcessor.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly searchService: SearchService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case SEARCH_INDEXER_JOBS.INDEX_MESSAGE:
        await this.indexMessage(job);
        return;
      case SEARCH_INDEXER_JOBS.INDEX_USER:
        await this.indexUser(job);
        return;
      case SEARCH_INDEXER_JOBS.DELETE_MESSAGE:
        await this.deleteMessage(job);
        return;
      case SEARCH_INDEXER_JOBS.DELETE_USER:
        await this.deleteUser(job);
        return;
      default:
        this.logger.warn(`Skipping unsupported search job: ${job.name}`);
    }
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job) {
    this.logger.debug(`Search job completed: ${job.name} (${job.id})`);
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Search job failed: ${job?.name ?? "unknown"} (${job?.id ?? "n/a"})`,
      error?.stack,
    );
  }

  private async indexMessage(job: Job) {
    const { messageId } = validateJobPayload(IndexMessageJobData, job.data);
    const message = await this.messageRepo.findOne({
      where: { id: messageId },
      relations: {
        recipients: true,
      },
    });

    if (!message) {
      this.logger.warn(`Message ${messageId} not found for indexing`);
      return;
    }

    await this.searchService.indexMessage(message);
  }

  private async indexUser(job: Job) {
    const { userId } = validateJobPayload(IndexUserJobData, job.data);
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ["department", "subsidiary"],
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found for indexing`);
      return;
    }

    await this.searchService.indexUser(user);
  }

  private async deleteMessage(job: Job) {
    const { messageId } = validateJobPayload(DeleteMessageJobData, job.data);
    await this.searchService.deleteMessage(messageId);
  }

  private async deleteUser(job: Job) {
    const { userId } = validateJobPayload(DeleteUserJobData, job.data);
    await this.searchService.deleteUser(userId);
  }
}
