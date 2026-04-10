import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";
import { MailController } from "./mail.controller";
import { MailService } from "./mail.service";
import { MailGateway } from "./mail.gateway";
import { Message } from "./entities/message.entity";
import { Thread } from "./entities/thread.entity";
import { MessageRecipient } from "./entities/message-recipient.entity";
import { NotificationsModule } from "../notifications/notifications.module";
import { User } from "../users/entities/user.entity";
import { Attachment } from "../files/entities/attachment.entity";
import { SearchModule } from "@modules/search/search.module";

@Module({
  imports: [
    SearchModule,
    TypeOrmModule.forFeature([
      Message,
      Thread,
      MessageRecipient,
      User,
      Attachment,
    ]),
    BullModule.registerQueue({ name: "mail-delivery" }),
    NotificationsModule,
  ],
  controllers: [MailController],
  providers: [MailService, MailGateway],
  exports: [MailService, TypeOrmModule],
})
export class MailModule {}
