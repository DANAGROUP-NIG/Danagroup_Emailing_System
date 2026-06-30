import { User } from "@modules/users/entities/user.entity";
import { Injectable, Logger } from "@nestjs/common";
import { ElasticsearchService } from "@nestjs/elasticsearch";
import { InjectRepository } from "@nestjs/typeorm";
import { MessageSearchBody, UserSearchBody } from "src/types/types";
import { Brackets, Repository } from "typeorm";
import { Message } from "@modules/mail/entities/message.entity";

export interface UserSearchHit {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department?: string;
  departmentId?: string;
  subsidiary?: string;
  subsidiaryId?: string;
  jobTitle?: string;
  isActive: boolean;
  avatarUrl?: string;
  createdAt?: Date;
}

export interface PaginatedUserSearchResult {
  hits: UserSearchHit[];
  total: number;
  page: number;
  limit: number;
  lastPage: number;
  source: "elasticsearch" | "postgres";
}

export interface MailSearchHit {
  id: string;
  subject: string;
  bodySnippet: string;
  senderId: string;
  sentAt: Date;
}

export interface PaginatedMailSearchResult {
  hits: MailSearchHit[];
  total: number;
  source: "elasticsearch" | "postgres";
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  private readonly USER_INDEX = "dims-users";
  private readonly MESSAGE_INDEX = "dims-messages";

  private esAvailable = true;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    private readonly es: ElasticsearchService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log("Initializing Elasticsearch indexes...");
    try {
      await this.ensureUserIndexExists();
      await this.ensureMessageIndexExists();
      this.esAvailable = true;
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string; meta?: { statusCode?: number } };
      this.logger.warn(
        `ES index init failed: [${e?.name}] ${e?.message || "(no message)"} status=${e?.meta?.statusCode ?? "?"}. Searches will fall back to PostgreSQL.`,
      );
      this.esAvailable = false;
      return;
    }

    this.logger.log("Starting initial user data sync to Elasticsearch...");
    try {
      await this.syncUsersToIndex();
      this.logger.log("Elasticsearch is ready and synced.");
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string; meta?: { statusCode?: number } };
      this.logger.warn(
        `syncUsersToIndex failed: [${e?.name}] ${e?.message || "(no message)"}. Searches will fall back to PostgreSQL.`,
      );
    }
  }

  private get commonAnalysisSettings() {
    return {
      char_filter: {
        underscore_to_space: {
          type: "mapping",
          mappings: ["_ => \\u0020"],
        },
      },
      tokenizer: {
        autocomplete_tokenizer: {
          type: "edge_ngram",
          min_gram: 1,
          max_gram: 20,
          token_chars: ["letter", "digit"],
        },
      },
      analyzer: {
        autocomplete_analyzer: {
          type: "custom",
          char_filter: ["underscore_to_space"],
          tokenizer: "autocomplete_tokenizer",
          filter: ["lowercase"],
        },
        text_cleaner: {
          type: "custom",
          char_filter: ["underscore_to_space"],
          tokenizer: "standard",
          filter: ["lowercase", "asciifolding"],
        },
        fulltext_analyzer: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase", "asciifolding", "stop"],
        },
      },
    };
  }

  private async ensureUserIndexExists() {
    const exists = await this.es.indices.exists({ index: this.USER_INDEX });
    if (exists) return;

    await this.es.indices.create({
      index: this.USER_INDEX,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      settings: { analysis: this.commonAnalysisSettings } as any,
      mappings: {
        properties: {
          firstName: {
            type: "text",
            analyzer: "autocomplete_analyzer",
            search_analyzer: "standard",
            fields: { keyword: { type: "keyword", ignore_above: 256 } },
          },
          lastName: {
            type: "text",
            analyzer: "autocomplete_analyzer",
            search_analyzer: "standard",
            fields: { keyword: { type: "keyword", ignore_above: 256 } },
          },
          email: { type: "keyword" },
          jobTitle: {
            type: "text",
            analyzer: "autocomplete_analyzer",
            search_analyzer: "standard",
          },
          role: { type: "keyword" },
          department: {
            type: "text",
            analyzer: "text_cleaner",
            fields: { keyword: { type: "keyword", ignore_above: 256 } },
          },
          subsidiary: {
            type: "text",
            analyzer: "text_cleaner",
            fields: { keyword: { type: "keyword", ignore_above: 256 } },
          },
          departmentId: { type: "keyword" },
          subsidiaryId: { type: "keyword" },
          isActive: { type: "boolean" },
          avatarUrl: { type: "keyword", index: false },
          createdAt: { type: "date" },
        },
      },
    });
    this.logger.log(`Created user index: ${this.USER_INDEX}`);
  }

  private async ensureMessageIndexExists() {
    const exists = await this.es.indices.exists({ index: this.MESSAGE_INDEX });
    if (exists) return;

    await this.es.indices.create({
      index: this.MESSAGE_INDEX,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      settings: { analysis: this.commonAnalysisSettings } as any,
      mappings: {
        properties: {
          id: { type: "keyword" },
          subject: {
            type: "text",
            analyzer: "fulltext_analyzer",
            fields: { autocomplete: { type: "text", analyzer: "autocomplete_analyzer", search_analyzer: "standard" } },
          },
          body: { type: "text", analyzer: "fulltext_analyzer" },
          senderId: { type: "keyword" },
          recipientIds: { type: "keyword" },
          sentAt: { type: "date" },
        },
      },
    });
    this.logger.log(`Created message index: ${this.MESSAGE_INDEX}`);
  }

  async syncUsersToIndex() {
    const users = await this.userRepo.find({
      relations: ["department", "subsidiary"],
    });

    if (users.length === 0) return;

    const operations = users.flatMap((user) => [
      { index: { _index: this.USER_INDEX, _id: user.id } },
      {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        jobTitle: user.jobTitle || null,
        role: user.role,
        isActive: user.isActive,
        department: user.department?.name || null,
        subsidiary: user.subsidiary?.name || null,
        departmentId: user.departmentId,
        subsidiaryId: user.subsidiaryId,
        avatarUrl: user.avatarUrl || null,
        createdAt: user.createdAt,
      },
    ]);

    await this.es.bulk({ refresh: true, operations });
    this.logger.log(`Synced ${users.length} users to Elasticsearch`);
  }

  async searchUsers(
    query: string,
    page = 1,
    limit = 10,
    filters?: { department?: string; subsidiary?: string; role?: string },
  ): Promise<PaginatedUserSearchResult> {
    if (!this.esAvailable) {
      return this.fallbackUserSearch(query, page, limit, filters);
    }

    const mustQuery = query
      ? {
          multi_match: {
            query,
            fields: ["firstName^4", "lastName^4", "email^2", "jobTitle^2"],
            type: "bool_prefix" as const,
            fuzziness: "AUTO" as const,
            prefix_length: 1,
          },
        }
      : { match_all: {} };

    const filterClauses: object[] = [{ term: { isActive: true } }];

    if (filters?.department) {
      filterClauses.push({ term: { "department.keyword": filters.department } });
    }
    if (filters?.subsidiary) {
      filterClauses.push({ term: { "subsidiary.keyword": filters.subsidiary } });
    }
    if (filters?.role) {
      filterClauses.push({ term: { role: filters.role } });
    }

    try {
      const response = await this.es.search<UserSearchBody>({
        index: this.USER_INDEX,
        from: (page - 1) * limit,
        size: limit,
        query: {
          bool: {
            must: [mustQuery],
            filter: filterClauses,
          },
        },
        sort: query ? [{ _score: { order: "desc" } }] : [{ "firstName.keyword": { order: "asc" } }],
      });

      const total =
        typeof response.hits.total === "number"
          ? response.hits.total
          : (response.hits.total?.value ?? 0);

      const hits: UserSearchHit[] = response.hits.hits.map((h) => ({
        id: h._id,
        firstName: h._source?.firstName ?? "",
        lastName: h._source?.lastName ?? "",
        email: h._source?.email ?? "",
        role: h._source?.role ?? "",
        department: h._source?.department,
        departmentId: h._source?.departmentId,
        subsidiary: h._source?.subsidiary,
        subsidiaryId: h._source?.subsidiaryId,
        jobTitle: h._source?.jobTitle,
        isActive: h._source?.isActive ?? true,
        avatarUrl: h._source?.avatarUrl,
        createdAt: h._source?.createdAt,
      }));

      return {
        hits,
        total,
        page,
        limit,
        lastPage: total === 0 ? 1 : Math.ceil(total / limit),
        source: "elasticsearch",
      };
    } catch (error) {
      this.logger.warn(
        `ES searchUsers failed, falling back to PostgreSQL: ${(error as Error).message}`,
      );
      this.esAvailable = false;
      setTimeout(() => { this.esAvailable = true; }, 30_000);
      return this.fallbackUserSearch(query, page, limit, filters);
    }
  }

  async searchMail(
    userId: string,
    query: string,
    limit = 10,
  ): Promise<PaginatedMailSearchResult> {
    if (!query?.trim()) {
      return { hits: [], total: 0, source: "elasticsearch" };
    }

    if (!this.esAvailable) {
      return this.fallbackMailSearch(userId, query, limit);
    }

    try {
      const response = await this.es.search<MessageSearchBody>({
        index: this.MESSAGE_INDEX,
        size: limit,
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query,
                  fields: ["subject^3", "subject.autocomplete^2", "body"],
                  type: "best_fields" as const,
                  fuzziness: "AUTO" as const,
                  prefix_length: 1,
                },
              },
            ],
            filter: [
              {
                bool: {
                  should: [
                    { term: { senderId: userId } },
                    { term: { recipientIds: userId } },
                  ],
                  minimum_should_match: 1,
                },
              },
            ],
          },
        },
        sort: [{ sentAt: { order: "desc" } }],
        highlight: {
          fields: {
            subject: { number_of_fragments: 0 },
            body: { fragment_size: 120, number_of_fragments: 1 },
          },
          pre_tags: ["<mark>"],
          post_tags: ["</mark>"],
        },
      });

      const total =
        typeof response.hits.total === "number"
          ? response.hits.total
          : (response.hits.total?.value ?? 0);

      const hits: MailSearchHit[] = response.hits.hits.map((h) => ({
        id: h._id,
        subject: h._source?.subject ?? "",
        bodySnippet:
          h.highlight?.body?.[0] ??
          (h._source?.body?.substring(0, 120) ?? ""),
        senderId: h._source?.senderId ?? "",
        sentAt: h._source?.sentAt ?? new Date(),
      }));

      return { hits, total, source: "elasticsearch" };
    } catch (error) {
      this.logger.warn(
        `ES searchMail failed, falling back to PostgreSQL: ${(error as Error).message}`,
      );
      this.esAvailable = false;
      setTimeout(() => { this.esAvailable = true; }, 30_000);
      return this.fallbackMailSearch(userId, query, limit);
    }
  }

  private async fallbackUserSearch(
    query: string,
    page = 1,
    limit = 10,
    filters?: { department?: string; subsidiary?: string; role?: string },
  ): Promise<PaginatedUserSearchResult> {
    this.logger.warn("Using PostgreSQL fallback for user search");

    const qb = this.userRepo
      .createQueryBuilder("user")
      .where("user.isActive = true");

    if (query) {
      qb.andWhere(
        new Brackets((wb) => {
          wb.where("user.firstName ILIKE :q", { q: `%${query}%` })
            .orWhere("user.lastName ILIKE :q", { q: `%${query}%` })
            .orWhere("user.email ILIKE :q", { q: `%${query}%` })
            .orWhere("user.jobTitle ILIKE :q", { q: `%${query}%` });
        }),
      );
    }
    if (filters?.department) {
      qb.andWhere("user.departmentId = :dept", { dept: filters.department });
    }
    if (filters?.subsidiary) {
      qb.andWhere("user.subsidiaryId = :sub", { sub: filters.subsidiary });
    }
    if (filters?.role) {
      qb.andWhere("user.role = :role", { role: filters.role });
    }

    qb.orderBy("user.firstName", "ASC")
      .skip((page - 1) * limit)
      .take(limit);

    const [users, total] = await qb.getManyAndCount();

    const hits: UserSearchHit[] = users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      jobTitle: u.jobTitle,
      departmentId: u.departmentId,
      subsidiaryId: u.subsidiaryId,
      isActive: u.isActive,
      avatarUrl: u.avatarUrl,
      createdAt: u.createdAt,
    }));

    return {
      hits,
      total,
      page,
      limit,
      lastPage: total === 0 ? 1 : Math.ceil(total / limit),
      source: "postgres",
    };
  }

  private async fallbackMailSearch(
    userId: string,
    query: string,
    limit = 10,
  ): Promise<PaginatedMailSearchResult> {
    this.logger.warn("Using PostgreSQL fallback for mail search");

    const messages = await this.messageRepo
      .createQueryBuilder("message")
      .leftJoin("message.recipients", "recipient")
      .where("message.isDraft = false")
      .andWhere(
        new Brackets((qb) => {
          qb.where("message.senderId = :userId", { userId }).orWhere(
            "recipient.recipientId = :userId",
            { userId },
          );
        }),
      )
      .andWhere(
        new Brackets((qb) => {
          qb.where("message.subject ILIKE :q", { q: `%${query}%` }).orWhere(
            "message.body ILIKE :q",
            { q: `%${query}%` },
          );
        }),
      )
      .distinct(true)
      .orderBy("message.sentAt", "DESC")
      .take(limit)
      .getMany();

    const hits: MailSearchHit[] = messages.map((m) => ({
      id: m.id,
      subject: m.subject,
      bodySnippet: m.body?.substring(0, 120) ?? "",
      senderId: m.senderId,
      sentAt: m.sentAt ?? m.createdAt,
    }));

    return { hits, total: hits.length, source: "postgres" };
  }

  async indexMessage(message: {
    id: string;
    subject: string;
    body: string;
    senderId: string;
    sentAt?: Date;
    recipients?: Array<{ recipientId?: string; id?: string }>;
  }) {
    try {
      return await this.es.index<MessageSearchBody>({
        index: this.MESSAGE_INDEX,
        id: message.id,
        document: {
          id: message.id,
          subject: message.subject,
          body: message.body,
          senderId: message.senderId,
          recipientIds:
            message.recipients?.map((r) => r.recipientId || r.id) || [],
          sentAt: message.sentAt || new Date(),
        },
      });
    } catch (error: unknown) {
      const e = error as { name?: string; message?: string };
      this.logger.warn(
        `indexMessage(${message?.id}) skipped: [${e?.name ?? "Error"}] ${e?.message || "(no message)"}`,
      );
      return null;
    }
  }

  async indexUser(user: User) {
    try {
      return await this.es.index<UserSearchBody>({
        index: this.USER_INDEX,
        id: user.id,
        document: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          jobTitle: user.jobTitle || null,
          department: user.department?.name || null,
          subsidiary: user.subsidiary?.name || null,
          departmentId: user.departmentId || user.department?.id,
          subsidiaryId: user.subsidiaryId || user.subsidiary?.id,
          role: user.role,
          isActive: user.isActive,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        },
      });
    } catch (error: unknown) {
      const e = error as { name?: string; message?: string };
      this.logger.warn(
        `indexUser(${user?.id}) skipped: [${e?.name ?? "Error"}] ${e?.message || "(no message)"}`,
      );
      return null;
    }
  }

  async deleteUser(userId: string) {
    return this.es
      .delete({
        index: this.USER_INDEX,
        id: userId,
        refresh: "wait_for",
      })
      .catch((err: unknown) => {
        const e = err as { meta?: { statusCode?: number } };
        if (e?.meta?.statusCode !== 404) {
          this.logger.warn(`deleteUser(${userId}) failed in ES: ${(err as Error).message}`);
        }
      });
  }

  async deleteMessage(messageId: string) {
    return this.es
      .delete({
        index: this.MESSAGE_INDEX,
        id: messageId,
        refresh: "wait_for",
      })
      .catch((err: unknown) => {
        const e = err as { meta?: { statusCode?: number } };
        if (e?.meta?.statusCode !== 404) {
          this.logger.warn(`deleteMessage(${messageId}) failed in ES: ${(err as Error).message}`);
        }
      });
  }
}
