import { Module } from "@nestjs/common";
import { ElasticsearchModule } from "@nestjs/elasticsearch";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { SearchService } from "./search.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "@modules/users/entities/user.entity";

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
  ],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
