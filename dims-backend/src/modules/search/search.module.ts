import { forwardRef, Module } from "@nestjs/common";
import { ElasticsearchModule } from "@nestjs/elasticsearch";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { SearchService } from "./search.service";
import { SearchController } from "./search.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "@modules/users/entities/user.entity";
import { UsersSearchService } from "@modules/users/users-search.service";
import { MailModule } from "@modules/mail/mail.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        node:
          config.get("ELASTICSEARCH_NODE") ||
          config.get("ES_NODE") ||
          "http://localhost:9200",
        auth: {
          username: config.get("ELASTICSEARCH_USERNAME"),
          password: config.get("ELASTICSEARCH_PASSWORD"),
        },
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => MailModule),
  ],
  controllers: [SearchController],
  providers: [SearchService, UsersSearchService],
  exports: [SearchService, UsersSearchService],
})
export class SearchModule {}
