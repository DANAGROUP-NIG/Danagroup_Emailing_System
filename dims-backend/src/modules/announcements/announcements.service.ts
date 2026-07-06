import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Announcement } from "./entities/announcement.entity";
import { User } from "@modules/users/entities/user.entity";
import { JobsService } from "@jobs/jobs.service";
import { CreateAnnouncementDto } from "./dto/create-announcement.dto";
import { UpdateAnnouncementDto } from "./dto/update-announcement.dto";
import { QueryAnnouncementsDto } from "./dto/query-announcements.dto";

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jobsService: JobsService,
  ) {}

  async findAll(query: QueryAnnouncementsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.announcementRepo
      .createQueryBuilder("announcement")
      .leftJoinAndSelect("announcement.author", "author")
      .leftJoinAndSelect("announcement.subsidiary", "subsidiary")
      .leftJoinAndSelect("announcement.department", "department");

    if (query.target) {
      qb.andWhere("announcement.target = :target", { target: query.target });
    }
    if (query.subsidiaryId) {
      qb.andWhere("announcement.subsidiaryId = :subsidiaryId", {
        subsidiaryId: query.subsidiaryId,
      });
    }
    if (query.departmentId) {
      qb.andWhere("announcement.departmentId = :departmentId", {
        departmentId: query.departmentId,
      });
    }

    if (query.isPinned !== undefined) {
      qb.andWhere("announcement.isPinned = :isPinned", { isPinned: query.isPinned });
    }

    qb.orderBy("announcement.isPinned", "DESC")
      .addOrderBy("announcement.publishedAt", "DESC", "NULLS LAST")
      .addOrderBy("announcement.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findById(id: string) {
    const announcement = await this.announcementRepo.findOne({
      where: { id },
      relations: { author: true, subsidiary: true, department: true },
    });
    if (!announcement) {
      throw new NotFoundException("Announcement not found");
    }
    return announcement;
  }

  async create(dto: CreateAnnouncementDto, authorId: string) {
    const announcement = this.announcementRepo.create({
      ...dto,
      authorId,
      publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : new Date(),
    });

    const saved = await this.announcementRepo.save(announcement);

    const targetUsers = await this.userRepo.find({
      where: {
        isActive: true,
        ...(dto.target === "subsidiary" && dto.subsidiaryId
          ? { subsidiaryId: dto.subsidiaryId }
          : {}),
        ...(dto.target === "department" && dto.departmentId
          ? { departmentId: dto.departmentId }
          : {}),
      },
      select: ["id"],
    });

    if (targetUsers.length > 0) {
      await this.jobsService.enqueueAnnouncement({
        userIds: targetUsers.map((u) => u.id),
        title: dto.title,
        body: dto.body,
        referenceId: saved.id,
      });
    }

    return saved;
  }

  async update(
    id: string,
    dto: UpdateAnnouncementDto,
    requesterId: string,
    requesterRole: string,
  ) {
    const announcement = await this.findById(id);

    if (
      announcement.authorId !== requesterId &&
      requesterRole !== "subsidiary_admin" &&
      requesterRole !== "group_admin"
    ) {
      throw new ForbiddenException(
        "You can only update announcements you authored",
      );
    }

    Object.assign(announcement, dto);
    await this.announcementRepo.save(announcement);
    return this.findById(id);
  }

  async togglePin(id: string, requesterId: string, requesterRole: string) {
    if (
      requesterRole !== "subsidiary_admin" &&
      requesterRole !== "group_admin"
    ) {
      throw new ForbiddenException("Only admins can pin announcements");
    }

    const announcement = await this.findById(id);
    announcement.isPinned = !announcement.isPinned;
    await this.announcementRepo.save(announcement);
    return this.findById(id);
  }

  async delete(id: string, requesterId: string, requesterRole: string) {
    const announcement = await this.findById(id);

    if (
      announcement.authorId !== requesterId &&
      requesterRole !== "subsidiary_admin" &&
      requesterRole !== "group_admin"
    ) {
      throw new ForbiddenException(
        "You can only delete announcements you authored",
      );
    }

    await this.announcementRepo.remove(announcement);
  }
}
