import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";
import { Attachment } from "./entities/attachment.entity";
import {
  createMinioClient,
  MINIO_CLIENT,
  MINIO_BUCKET,
} from "../../config/storage.config";

@Module({
  imports: [TypeOrmModule.forFeature([Attachment]), ConfigModule],
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
