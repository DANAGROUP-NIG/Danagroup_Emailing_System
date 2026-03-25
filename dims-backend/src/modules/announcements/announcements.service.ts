import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Announcement } from "./entities/announcement.entity";

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
  ) {}

  // TODO: Implement findAll(query): paginated Announcement[]
  //   - Filters: target, subsidiaryId, departmentId
  //   - Pinned items first, then by publishedAt DESC
  // TODO: Implement findById(id): Announcement
  // TODO: Implement create(dto, authorId): Announcement
  // TODO: Implement update(id, dto, requesterId): Announcement (owner/admin check)
  // TODO: Implement togglePin(id, requesterId): Announcement (admin only)
  // TODO: Implement delete(id, requesterId): void (owner/admin check)
}
