// health.module.ts
import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { HealthController } from "./health.controller";
import { RedisHealthIndicator } from "./redis.health";
import { MinioHealthIndicator } from "./minio.health";
import { ElasticsearchHealthIndicator } from "./elasticsearch.health";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [ConfigModule, TerminusModule],
  controllers: [HealthController],
  providers: [
    RedisHealthIndicator,
    MinioHealthIndicator,
    ElasticsearchHealthIndicator,
  ],
})
export class HealthModule {}
