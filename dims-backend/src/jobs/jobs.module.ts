import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { MailDeliveryProcessor } from "./mail-delivery.processor";
import { SearchIndexerProcessor } from "./search-indexer.processor";
import { NotificationProcessor } from "./notification.processor";
import { NotificationsModule } from "../modules/notifications/notifications.module";
import { SearchModule } from "../modules/search/search.module";

@Module({
  imports: [
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
