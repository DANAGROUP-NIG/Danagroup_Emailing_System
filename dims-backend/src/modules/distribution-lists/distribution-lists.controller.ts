import {
  Body, Controller, Delete, Get, Param, Patch, Post,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { User } from "@modules/users/entities/user.entity";
import { DistributionListsService } from "./distribution-lists.service";
import {
  AddMembersDto,
  CreateDistributionListDto,
  UpdateDistributionListDto,
} from "./dto/distribution-list.dto";

@ApiTags("distribution-lists")
@ApiBearerAuth()
@Controller("distribution-lists")
export class DistributionListsController {
  constructor(private readonly service: DistributionListsService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.service.findAll(user.id);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: User) {
    return this.service.findOne(id, user.id);
  }

  @Post()
  create(@Body() dto: CreateDistributionListDto, @CurrentUser() user: User) {
    return this.service.create(dto, user.id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateDistributionListDto, @CurrentUser() user: User) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: User) {
    return this.service.remove(id, user.id);
  }

  @Post(":id/members")
  addMembers(@Param("id") id: string, @Body() dto: AddMembersDto, @CurrentUser() user: User) {
    return this.service.addMembers(id, dto, user.id);
  }

  @Delete(":id/members/:userId")
  removeMember(
    @Param("id") id: string,
    @Param("userId") userId: string,
    @CurrentUser() requester: User,
  ) {
    return this.service.removeMember(id, userId, requester.id);
  }

  @Get(":id/emails")
  resolveEmails(@Param("id") id: string, @CurrentUser() user: User) {
    void user;
    return this.service.resolveEmails(id);
  }
}
