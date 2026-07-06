import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  DistributionList,
  DistributionListMember,
} from "./entities/distribution-list.entity";
import { DistributionListsService } from "./distribution-lists.service";
import { DistributionListsController } from "./distribution-lists.controller";
import { User } from "@modules/users/entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([DistributionList, DistributionListMember, User]),
  ],
  controllers: [DistributionListsController],
  providers: [DistributionListsService],
  exports: [DistributionListsService],
})
export class DistributionListsModule {}
