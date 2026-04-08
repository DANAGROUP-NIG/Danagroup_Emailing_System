import { User } from "@modules/users/entities/user.entity";
import { Injectable, Logger } from "@nestjs/common";
import { ElasticsearchService } from "@nestjs/elasticsearch";
import { InjectRepository } from "@nestjs/typeorm";
import { MessageSearchBody, UserSearchBody } from "src/types/types";
import { Repository } from "typeorm";



@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  private readonly USER_INDEX = 'dims-users';
  private readonly MESSAGE_INDEX = 'dims-messages';

  constructor(
    @InjectRepository(User) 
    private readonly userRepo: Repository<User>,
    private readonly es: ElasticsearchService, 
  ) {}

  // This runs automatically when the app starts
  async onApplicationBootstrap() {
    this.logger.log('Initializing Elasticsearch indexes...');
    await this.ensureIndexExists(this.USER_INDEX);
    await this.ensureIndexExists(this.MESSAGE_INDEX);

    this.logger.log('Starting initial data sync...');
    await this.syncUsersToIndex();
    this.logger.log('Elasticsearch is ready and synced.');
  }

  // private async ensureIndexExists(index: string) {
  //   const exists = await this.es.indices.exists({ index });
  //   if (!exists) {
  //     await this.es.indices.create({ index });
  //     this.logger.log(`Created missing index: ${index}`);
  //   }
  // }

  private async ensureIndexExists(index: string) {
    const exists = await this.es.indices.exists({ index });
    if (!exists) {
      await this.es.indices.create({
        index,
        body: {
          settings: {
            analysis: {
              // 1. Define a filter that turns underscores into spaces
              char_filter: {
                underscore_filter: {
                  type: 'mapping',
                  mappings: ['_ => \\u0020'], 
                },
              },
              analyzer: {
                // 2. Use the filter in your autocomplete (for names)
                autocomplete_analyzer: {
                  type: 'custom',
                  char_filter: ['underscore_filter'],
                  tokenizer: 'autocomplete_tokenizer',
                  filter: ['lowercase'],
                },
                // 3. Create a clean analyzer for roles/departments
                text_cleaner: {
                  type: 'custom',
                  char_filter: ['underscore_filter'],
                  tokenizer: 'standard',
                  filter: ['lowercase'],
                },
              },
              tokenizer: {
                autocomplete_tokenizer: {
                  type: 'edge_ngram',
                  min_gram: 1,
                  max_gram: 20,
                  token_chars: ['letter', 'digit'],
                },
              },
            },
          },
          mappings: {
            properties: {
              firstName: { 
                type: 'text', 
                analyzer: 'autocomplete_analyzer', 
                search_analyzer: 'standard' 
              },
              lastName: { 
                type: 'text', 
                analyzer: 'autocomplete_analyzer', 
                search_analyzer: 'standard' 
              },
              email: { type: 'keyword' },
              // 4. Assign the 'text_cleaner' to these fields
              role: { type: 'text', analyzer: 'text_cleaner' },
              department: { type: 'text', analyzer: 'text_cleaner' },
              subsidiary: { type: 'text', analyzer: 'text_cleaner' },
            },
          },
        },
      });
      this.logger.log(`Created index with Autocomplete and Role-Mapping: ${index}`);
    }
  }



  async syncUsersToIndex() {
  // 1. Fetch users WITH their department and subsidiary objects
  const users = await this.userRepo.find({
    relations: ['department', 'subsidiary']
  });
  
  if (users.length === 0) return;

  const operations = users.flatMap(user => [
    { index: { _index: this.USER_INDEX, _id: user.id } },
    {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      // 2. Store the actual names (e.g. "Finance") instead of the IDs
      // Use optional chaining because these might be null in the DB
      department: user.department?.name || null, 
      subsidiary: user.subsidiary?.name || null,
      department_id: user.department_id, // Keep IDs too, just in case
      subsidiary_id: user.subsidiary_id
    }
  ]);

  await this.es.bulk({ refresh: true, operations });
}

  // Low-level ES User Search
  async searchUsers(
    query: string, 
  limit = 10, 
  filters?: { department?: string; subsidiary?: string; role?: string }
  ) {
    // If query is empty, we want to see ALL users that match the filters
    const mustQuery = query
      ? {
          multi_match: {
            query,
            fields: ['firstName^3', 'lastName^3', 'email'],
            type: "bool_prefix" as const, // Allows partial word matches for autocomplete
            operator: 'and' as const,
            fuzziness: 'AUTO' as const,
          },
        }
      : { match_all: {} }; // Return everything if no text is typed

    try {
      const response = await this.es.search<UserSearchBody>({
        index: this.USER_INDEX,
        size: limit,
        query: {
          bool: {
            must: [mustQuery], // Use our 'smart' query
            filter: [
              { term: { isActive: true } },
              // 2. Use 'match' for text filters to ignore case sensitivity
              ...(filters?.department ? [{ match: { department: filters.department } }] : []),
              ...(filters?.subsidiary ? [{ match: { subsidiary: filters.subsidiary } }] : []),
              ...(filters?.role ? [{ match: { role: filters.role } }] : []),
            ],
          },
        },
      });

      return response.hits;

    } catch (error) {
      // Catch the missing index error so the app doesn't crash
      if ((error as any).meta?.body?.error?.type === 'index_not_found_exception') {
        console.warn(`Elasticsearch index "${this.USER_INDEX}" not found. Returning empty.`);
        return { total: { value: 0, relation: 'eq' }, hits: [] };
      }
      throw error;
    }
  }

  // TODO: Implement indexMessage(message): void
  //   - Index in 'dims-messages' index: id, subject, body, senderId, recipientIds, sentAt
  async indexMessage(message: any) { // Use your Message Entity type here
    return this.es.index<MessageSearchBody>({
      index: this.MESSAGE_INDEX,
      id: message.id,
      document: {
        id: message.id,
        subject: message.subject,
        body: message.body,
        senderId: message.senderId,
        recipientIds: message.recipients?.map(r => r.recipient_id) || [],
        sentAt: message.sentAt || new Date(),
      },
    });
  }

  // TODO: Implement indexUser(user): void
  //   - Index in 'dims-users' index: id, firstName, lastName, email, jobTitle, department, subsidiary
  async indexUser(user: User) {
    return this.es.index<UserSearchBody>({
      index: this.USER_INDEX,
      id: user.id,
      document: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        department: user.department?.name || null,
        subsidiary: user.subsidiary?.name || null,

        // Store the IDs for filtering/exact matches
        department_id: user.department_id || user.department?.id,
        subsidiary_id: user.subsidiary_id || user.subsidiary?.id,
        role: user.role,
        isActive: user.isActive,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    });
  }

  // TODO: Implement deleteUser(userId): void
  async deleteUser(userId: string) {
    return this.es.delete({
      index: this.USER_INDEX,
      id: userId,
      refresh: 'wait_for', // Ensures the user is gone before the next search
    }).catch(() => console.warn(`User ${userId} not found in ES for deletion`));
  }


  // TODO: Implement deleteMessage(messageId): void
  async deleteMessage(messageId: string) {
    return this.es.delete({
      index: this.MESSAGE_INDEX,
      id: messageId,
      refresh: 'wait_for',
    }).catch(() => console.warn(`Message ${messageId} not found in ES`));
  }

 
}
