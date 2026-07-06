import { Injectable } from "@nestjs/common";
import { SearchService } from "@modules/search/search.service";

export interface UnifiedSearchResult {
  type: "user" | "mail";
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

export interface UnifiedSearchResponse {
  results: UnifiedSearchResult[];
  total: number;
  page: number;
}

@Injectable()
export class UsersSearchService {
  constructor(private readonly searchService: SearchService) {}

  async unifiedSearch(
    query: string,
    type: "mail" | "users" | "all" = "all",
    requesterId: string,
    page = 1,
    limit = 10,
    filters?: { department?: string; subsidiary?: string; role?: string },
  ): Promise<UnifiedSearchResponse> {
    const results: UnifiedSearchResult[] = [];
    let total = 0;

    if (type === "users" || type === "all") {
      const userResult = await this.searchService.searchUsers(
        query,
        page,
        limit,
        filters,
      );
      const userResults: UnifiedSearchResult[] = userResult.hits.map((h) => ({
        type: "user" as const,
        id: h.id,
        title: `${h.firstName} ${h.lastName}`,
        subtitle: h.email,
        url: `/directory/${h.id}`,
      }));
      results.push(...userResults);
      total += userResult.total;
    }

    if ((type === "mail" || type === "all") && requesterId) {
      const mailResult = await this.searchService.searchMail(
        requesterId,
        query,
        limit,
      );
      const mailResults: UnifiedSearchResult[] = mailResult.hits.map((m) => ({
        type: "mail" as const,
        id: m.id,
        title: m.subject,
        subtitle: m.bodySnippet ? `${m.bodySnippet}...` : "",
        url: `/mail/${m.id}`,
      }));
      results.push(...mailResults);
      total += mailResult.total;
    }

    return { results, total, page };
  }

  async remove(id: string) {
    return this.searchService.deleteUser(id);
  }
}
