import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, Like, FindOptionsWhere } from "typeorm";
import { AuditLog } from "./entities/audit-log.entity";

export interface LogEventInput {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  meta?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  statusCode?: number;
}

export interface AuditQueryDto {
  actorId?: string;
  action?: string;
  resource?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async log(input: LogEventInput): Promise<void> {
    try {
      const entry = this.repo.create({
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId ?? null,
        meta: input.meta ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent?.slice(0, 512) ?? null,
        statusCode: input.statusCode ?? 200,
      });
      await this.repo.save(entry);
    } catch (err) {
      this.logger.error(`Failed to write audit log: ${(err as Error).message}`);
    }
  }

  async query(dto: AuditQueryDto): Promise<{ data: AuditLog[]; total: number; page: number; lastPage: number }> {
    const page = Math.max(1, dto.page ?? 1);
    const limit = Math.min(100, Math.max(1, dto.limit ?? 50));

    const where: FindOptionsWhere<AuditLog> = {};
    if (dto.actorId) where.actorId = dto.actorId;
    if (dto.action) where.action = Like(`%${dto.action}%`);
    if (dto.resource) where.resource = dto.resource;
    if (dto.from || dto.to) {
      const from = dto.from ? new Date(dto.from) : new Date(0);
      const to = dto.to ? new Date(dto.to) : new Date();
      where.createdAt = Between(from, to);
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
      relations: { actor: true },
    });

    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }
}
