import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { MailRulesService } from "./mail-rules.service";
import { CreateMailRuleDto } from "./dto/create-mail-rule.dto";
import { UpdateMailRuleDto } from "./dto/update-mail-rule.dto";

@ApiTags("mail-rules")
@ApiBearerAuth()
@Controller("mail-rules")
export class MailRulesController {
  constructor(private readonly mailRulesService: MailRulesService) {}

  @Get()
  @ApiOperation({ summary: "List all mail rules for the current user" })
  findAll(@CurrentUser() user: { userId: string }) {
    return this.mailRulesService.findAllForUser(user.userId);
  }

  @Post()
  @ApiOperation({ summary: "Create a new mail rule" })
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateMailRuleDto,
  ) {
    return this.mailRulesService.create(user.userId, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a mail rule" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateMailRuleDto,
  ) {
    return this.mailRulesService.update(id, user.userId, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a mail rule" })
  remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.mailRulesService.delete(id, user.userId);
  }
}
