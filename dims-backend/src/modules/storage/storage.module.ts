import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import {
  createMinioClient,
  MINIO_CLIENT,
  MINIO_BUCKET,
} from "../../config/storage.config";
import { StorageService } from "./storage.service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: MINIO_CLIENT,
      useFactory: (config: ConfigService) => createMinioClient(config),
      inject: [ConfigService],
    },
    {
      provide: MINIO_BUCKET,
      useFactory: (config: ConfigService) =>
        config.get<string>("MINIO_BUCKET", "dims-files"),
      inject: [ConfigService],
    },
    StorageService,
  ],
  exports: [StorageService, MINIO_CLIENT, MINIO_BUCKET],
})
export class StorageModule {}
