import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";
import { ElasticsearchModule } from "@nestjs/elasticsearch";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { MailModule } from "./modules/mail/mail.module";
import { FilesModule } from "./modules/files/files.module";
import { AnnouncementsModule } from "./modules/announcements/announcements.module";
import { DepartmentsModule } from "./modules/departments/departments.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { SearchModule } from "./modules/search/search.module";
import { JobsModule } from "./jobs/jobs.module";
import databaseConfig from "./config/database.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get("REDIS_HOST", "localhost"),
          port: config.get<number>("REDIS_PORT", 6379),
          password: config.get("REDIS_PASSWORD") || undefined,
        },
      }),
      inject: [ConfigService],
    }),
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        node: config.get("ELASTICSEARCH_NODE", "http://localhost:9200"),
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    AuthModule,
    UsersModule,
    MailModule,
    FilesModule,
    AnnouncementsModule,
    DepartmentsModule,
    NotificationsModule,
    SearchModule,
    JobsModule,
  ],
})
export class AppModule {}
