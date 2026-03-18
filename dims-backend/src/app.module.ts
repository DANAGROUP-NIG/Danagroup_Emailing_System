import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";
import { ElasticsearchModule } from "@nestjs/elasticsearch";
import { ThrottlerModule } from "@nestjs/throttler";

// Core Modules
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { MailModule } from "./modules/mail/mail.module";
import { FilesModule } from "./modules/files/files.module";
import { AnnouncementsModule } from "./modules/announcements/announcements.module";
import { DepartmentsModule } from "./modules/departments/departments.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { SearchModule } from "./modules/search/search.module";
import { JobsModule } from "./jobs/jobs.module";
import { HealthModule } from './health/health.module';

// Config
import databaseConfig from "./config/database.config";

@Module({
  imports: [
    /**
     * Global Environment Config
     */
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    /**
     * Database (PostgreSQL via TypeORM)
     */
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),

    /**
     * Queue System (BullMQ - Redis)
     * Used for async jobs like sending emails, notifications, indexing
     */
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>("REDIS_HOST", "localhost"),
          port: config.get<number>("REDIS_PORT", 6379),
          password: config.get<string>("REDIS_PASSWORD") || undefined,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 3000,
          },
          removeOnComplete: true,
        },
      }),
    }),

    /**
     * 🔍 Elasticsearch (for search: emails, users, announcements)
     */
    ElasticsearchModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        node: config.get<string>(
          "ELASTICSEARCH_NODE",
          "http://localhost:9200"
        ),
        maxRetries: 5,
        requestTimeout: 60000,
      }),
    }),

    /**
     * Rate Limiting (Security)
     */
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),

    /**
     * Feature Modules
     */
    AuthModule,
    UsersModule,
    MailModule,
    FilesModule,
    AnnouncementsModule,
    DepartmentsModule,
    NotificationsModule,
    SearchModule,
    JobsModule,
    HealthModule,
  ],
})
export class AppModule {}