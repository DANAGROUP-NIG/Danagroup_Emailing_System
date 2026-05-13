import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";
import { Attachment } from "./entities/attachment.entity";
import { MessageRecipient } from "../mail/entities/message-recipient.entity";
import { Message } from "../mail/entities/message.entity";
import {
  createMinioClient,
  MINIO_CLIENT,
  MINIO_BUCKET,
} from "../../config/storage.config";
import { UsersModule } from "@modules/users/users.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Attachment, Message, MessageRecipient]),
    ConfigModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [FilesController],
  providers: [
    FilesService,
    {
      provide: MINIO_CLIENT,
      useFactory: (config: ConfigService) => createMinioClient(config),
      inject: [ConfigService],
    },
    {
      provide: MINIO_BUCKET,
      useFactory: (config: ConfigService) =>
        config.get("MINIO_BUCKET", "dims-files"),
      inject: [ConfigService],
    },
  ],
  exports: [FilesService],
})
export class FilesModule {}
