import { BullModule } from "@nestjs/bullmq";
import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../modules/users/entities/user.entity";
import { MessageRecipient } from "../modules/mail/entities/message-recipient.entity";
import { Message } from "../modules/mail/entities/message.entity";
import { MailModule } from "../modules/mail/mail.module";
import { NotificationsModule } from "../modules/notifications/notifications.module";
import { MailRulesModule } from "../modules/mail-rules/mail-rules.module";
import { SearchModule } from "../modules/search/search.module";
import { CleanupProcessor } from "./cleanup.processor";
import { JobsController } from "./jobs.controller";
import { JobsScheduler } from "./jobs.scheduler";
import { JobsService } from "./jobs.service";
import { MailDeliveryProcessor } from "./mail-delivery.processor";
import { NotificationProcessor } from "./notification.processor";
import { QUEUES } from "./queue.constants";
import { SearchIndexerProcessor } from "./search-indexer.processor";

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, MessageRecipient, User]),
    BullModule.registerQueue(
      { name: QUEUES.MAIL_DELIVERY },
      { name: QUEUES.SEARCH_INDEXER },
      { name: QUEUES.NOTIFICATIONS },
      { name: QUEUES.CLEANUP },
    ),
    NotificationsModule,
    SearchModule,
    MailRulesModule,
    forwardRef(() => MailModule),
  ],
  controllers: [JobsController],
  providers: [
    CleanupProcessor,
    JobsScheduler,
    JobsService,
    MailDeliveryProcessor,
    SearchIndexerProcessor,
    NotificationProcessor,
  ],
  exports: [JobsService],
})
export class JobsModule {}
