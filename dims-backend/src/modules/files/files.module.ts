import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";
import { Attachment } from "./entities/attachment.entity";
import { MessageRecipient } from "../mail/entities/message-recipient.entity";
import { Message } from "../mail/entities/message.entity";
import { UsersModule } from "@modules/users/users.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Attachment, Message, MessageRecipient]),
    forwardRef(() => UsersModule),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
