import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MessageRecipient } from "../modules/mail/entities/message-recipient.entity";
import { Message } from "../modules/mail/entities/message.entity";
import { NotificationsModule } from "../modules/notifications/notifications.module";
import { SearchModule } from "../modules/search/search.module";
import { MailDeliveryProcessor } from "./mail-delivery.processor";
import { NotificationProcessor } from "./notification.processor";
import { SearchIndexerProcessor } from "./search-indexer.processor";

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, MessageRecipient]),
    BullModule.registerQueue(
      { name: "mail-delivery" },
      { name: "search-indexer" },
      { name: "notifications" },
    ),
    NotificationsModule,
    SearchModule,
  ],
  providers: [
    MailDeliveryProcessor,
    SearchIndexerProcessor,
    NotificationProcessor,
  ],
})
export class JobsModule {}
