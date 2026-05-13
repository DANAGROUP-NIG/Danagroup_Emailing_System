import { forwardRef, Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";
import { MailController } from "./mail.controller";
import { MailService } from "./mail.service";
import { MailGateway } from "./mail.gateway";
import { Message } from "./entities/message.entity";
import { Thread } from "./entities/thread.entity";
import { MessageRecipient } from "./entities/message-recipient.entity";
import { UserThreadState } from "./entities/UserThreadState.entity";
import { NotificationsModule } from "../notifications/notifications.module";
import { User } from "../users/entities/user.entity";
import { Attachment } from "../files/entities/attachment.entity";
import { AuthModule } from "@modules/auth/auth.module";
import { JobsModule } from "@jobs/jobs.module";
import { SearchModule } from "@modules/search/search.module";
import { UsersModule } from "@modules/users/users.module";
import { QUEUES } from "@jobs/queue.constants";

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => JobsModule),
    forwardRef(() => SearchModule),
    TypeOrmModule.forFeature([
      Message,
      Thread,
      MessageRecipient,
      UserThreadState,
      User,
      Attachment,
    ]),
    BullModule.registerQueue(
      { name: QUEUES.MAIL_DELIVERY },
      { name: QUEUES.SEARCH_INDEXER },
    ),
    NotificationsModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [MailController],
  providers: [MailService, MailGateway, Logger],
  exports: [MailService, MailGateway, TypeOrmModule],
})
export class MailModule {}
