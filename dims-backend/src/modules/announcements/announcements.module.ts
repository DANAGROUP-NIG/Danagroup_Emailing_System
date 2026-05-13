import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AnnouncementsController } from "./announcements.controller";
import { AnnouncementsService } from "./announcements.service";
import { Announcement } from "./entities/announcement.entity";
import { User } from "@modules/users/entities/user.entity";
import { JobsModule } from "@jobs/jobs.module";

@Module({
  imports: [TypeOrmModule.forFeature([Announcement, User]), JobsModule],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
