import { forwardRef, Module } from "@nestjs/common";
import { SearchService } from "./search.service";
import { SearchController } from "./search.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "@modules/users/entities/user.entity";
import { UsersSearchService } from "@modules/users/users-search.service";
import { MailModule } from "@modules/mail/mail.module";
import { Message } from "@modules/mail/entities/message.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Message]),
    forwardRef(() => MailModule),
  ],
  controllers: [SearchController],
  providers: [SearchService, UsersSearchService],
  exports: [SearchService, UsersSearchService],
})
export class SearchModule {}
