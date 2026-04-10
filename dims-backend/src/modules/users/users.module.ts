import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { User } from "./entities/user.entity";
import { MailModule } from "@modules/mail/mail.module";
import { UsersSearchService } from "./users-search.service";
import { SearchModule } from "@modules/search/search.module";
import { Department } from "@modules/departments/entities/department.entity";
import { Subsidiary } from "@modules/departments/entities/subsidiary.entity";

@Module({
  imports: [
    MailModule,
    SearchModule,
    TypeOrmModule.forFeature([User, Department, Subsidiary]),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersSearchService],
  exports: [UsersService],
})
export class UsersModule {}
