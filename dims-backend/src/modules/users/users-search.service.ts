// src/users/users-search.service.ts
import { Injectable } from "@nestjs/common";
import { MailService } from "@modules/mail/mail.service";
import { SearchService } from "@modules/search/search.service";

export interface UnifiedSearchResult {
  type: "user" | "mail";
  id: string;
  title: string; // Name for users, Subject for mail
  subtitle: string; // Email for users, Preview text for mail
  url: string; // e.g., /dashboard/users/123 or /dashboard/mail/456
}

@Injectable()
export class UsersSearchService {
  private readonly index = "users";

  constructor(
    private readonly searchService: SearchService, // Assuming you have a SearchService to query Elasticsearch
    private readonly mailService: MailService, // Assuming you have a MailService to query mails
  ) {}

  // TODO: Implement search(query, type, requesterId): SearchResult[]
  //   - type: 'mail' | 'users' | 'all'
  //   - For mail: query dims-messages where requesterId is sender or recipient
  //   - For users: query dims-users (all active users)
  //   - Returns unified SearchResult[] { type, id, title, subtitle, url }
  async unifiedSearch(
    query: string,
    type: "mail" | "users" | "all" = "all",
    requesterId: string,
    page = 1,
    limit = 10,
    filters?: { department?: string; subsidiary?: string; role?: string },
  ) {
    const results: UnifiedSearchResult[] = [];
    let total = 0;

    // 1. SEARCH USERS (Elasticsearch)
    if (type === "users" || type === "all") {
      const hits = await this.searchService.searchUsers(query, limit, filters);
      const userResults: UnifiedSearchResult[] = hits.hits.map((h) => ({
        type: "user" as const,
        id: h._id,
        title: `${h._source.firstName} ${h._source.lastName}`,
        subtitle: h._source.email,
        url: `/dashboard/users/${h._id}`,
      }));
      results.push(...userResults);
      total += (hits.total as any).value || 0;
    }

    // 2. SEARCH MAIL via MailService (Database Query)
    if (type === "mail" || type === "all") {
      const mails = await this.mailService.searchUserMail(
        requesterId,
        query,
        limit,
      );
      const mailResults: UnifiedSearchResult[] = mails.map((m) => ({
        type: "mail" as const,
        id: m.id,
        title: m.subject,
        subtitle: m.body.substring(0, 50) + "...",
        url: `/dashboard/mail/${m.id}`,
      }));
      results.push(...mailResults);
    }
    return { results, total, page };
  }

  async remove(id: string) {
    // Delegate to the core service to ensure index consistency
    return this.searchService.deleteUser(id);
  }
}
