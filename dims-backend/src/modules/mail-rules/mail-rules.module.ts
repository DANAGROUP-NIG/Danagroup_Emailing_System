import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MailRule } from "./entities/mail-rule.entity";
import { MailRulesService } from "./mail-rules.service";
import { MailRulesController } from "./mail-rules.controller";

@Module({
  imports: [TypeOrmModule.forFeature([MailRule])],
  controllers: [MailRulesController],
  providers: [MailRulesService],
  exports: [MailRulesService],
})
export class MailRulesModule {}
