import { forwardRef, Module } from "@nestjs/common";
import { SearchService } from "./search.service";
import { SearchController } from "./search.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "@modules/users/entities/user.entity";
import { UsersSearchService } from "@modules/users/users-search.service";
import { MailModule } from "@modules/mail/mail.module";
import { Message } from "@modules/mail/entities/message.entity";
import { ElasticsearchModule } from "@nestjs/elasticsearch";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Message]),
    forwardRef(() => MailModule),
    ConfigModule,
    ElasticsearchModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        node:
          config.get<string>("ELASTICSEARCH_NODE") ||
          config.get<string>("ES_NODE") ||
          "http://localhost:9200",
        maxRetries: 5,
        requestTimeout: 60000,
        sniffOnStart: false,
        sniffOnConnectionFault: false,
      }),
    }),
  ],
  controllers: [SearchController],
  providers: [SearchService, UsersSearchService],
  exports: [SearchService, UsersSearchService],
})
export class SearchModule {}
