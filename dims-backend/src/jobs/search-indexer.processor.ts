import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";

// TODO: Process 'search-indexer' queue jobs
// Job names: 'index-message', 'index-user', 'delete-message', 'delete-user'
// Steps:
//   index-message → SearchService.indexMessage(job.data.message)
//   index-user    → SearchService.indexUser(job.data.user)
//   delete-message → SearchService.deleteMessage(job.data.messageId)
//   delete-user   → SearchService.deleteUser(job.data.userId)

@Processor("search-indexer")
export class SearchIndexerProcessor extends WorkerHost {
  async process(job: Job): Promise<void> {
    // TODO: Implement switch on job.name
  }
}
