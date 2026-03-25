import { Injectable } from "@nestjs/common";
import { ElasticsearchService } from "@nestjs/elasticsearch";

@Injectable()
export class SearchService {
  constructor(private readonly esService: ElasticsearchService) {}

  // TODO: Implement indexMessage(message): void
  //   - Index in 'dims-messages' index: id, subject, body, senderId, recipientIds, sentAt

  // TODO: Implement indexUser(user): void
  //   - Index in 'dims-users' index: id, firstName, lastName, email, jobTitle, department, subsidiary

  // TODO: Implement search(query, type, requesterId): SearchResult[]
  //   - type: 'mail' | 'users' | 'all'
  //   - For mail: query dims-messages where requesterId is sender or recipient
  //   - For users: query dims-users (all active users)
  //   - Returns unified SearchResult[] { type, id, title, subtitle, url }

  // TODO: Implement deleteMessage(messageId): void
  // TODO: Implement deleteUser(userId): void
}
