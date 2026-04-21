import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { User } from "./entities/user.entity";
import { MailModule } from "@modules/mail/mail.module";
import { UsersSearchService } from "./users-search.service";
import { SearchModule } from "@modules/search/search.module";
import { Department } from "@modules/departments/entities/department.entity";
import { Subsidiary } from "@modules/departments/entities/subsidiary.entity";
import { MailService } from "@modules/mail/mail.service";
import { Message } from "@modules/mail/entities/message.entity";
import { Thread } from "@modules/mail/entities/thread.entity";
import { MessageRecipient } from "@modules/mail/entities/message-recipient.entity";
import { Attachment } from "@modules/files/entities/attachment.entity";

@Module({
  imports: [
    SearchModule,
    TypeOrmModule.forFeature([
      User,
      MessageRecipient,
      Attachment,
      Message,
      Thread,
      Department,
      Subsidiary,
    ]),
    forwardRef(() => MailModule),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersSearchService],
  exports: [UsersService],
})
export class UsersModule {}
