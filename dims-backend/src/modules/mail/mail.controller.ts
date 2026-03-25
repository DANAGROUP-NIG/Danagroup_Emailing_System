import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { MailService } from "./mail.service";
import { SendMailDto } from "./dto/send-mail.dto";
import { MailQueryDto } from "./dto/mail-query.dto";

@ApiTags("mail")
@ApiBearerAuth()
@Controller("mail")
export class MailController {
  constructor(private readonly mailService: MailService) {}

  // TODO: GET /mail/inbox — paginated inbox for current user
  @Get("inbox")
  @ApiOperation({ summary: "Get inbox messages (paginated)" })
  async getInbox(@Query() query: MailQueryDto) {}

  // TODO: GET /mail/sent — paginated sent messages
  @Get("sent")
  @ApiOperation({ summary: "Get sent messages (paginated)" })
  async getSent(@Query() query: MailQueryDto) {}

  // TODO: GET /mail/drafts — paginated drafts
  @Get("drafts")
  @ApiOperation({ summary: "Get draft messages (paginated)" })
  async getDrafts(@Query() query: MailQueryDto) {}

  // TODO: GET /mail/thread/:threadId — all messages in a thread
  @Get("thread/:threadId")
  @ApiOperation({ summary: "Get all messages in a thread" })
  async getThread(@Param("threadId") threadId: string) {}

  // TODO: POST /mail/send — send a new message
  @Post("send")
  @ApiOperation({ summary: "Send a new message" })
  async send(@Body() dto: SendMailDto) {}

  // TODO: POST /mail/draft — save as draft
  @Post("draft")
  @ApiOperation({ summary: "Save message as draft" })
  async saveDraft(@Body() dto: SendMailDto) {}

  // TODO: PATCH /mail/:id/read — mark message as read
  @Patch(":id/read")
  @ApiOperation({ summary: "Mark message as read" })
  async markRead(@Param("id") id: string) {}

  // TODO: PATCH /mail/:id/star — toggle star on message
  @Patch(":id/star")
  @ApiOperation({ summary: "Toggle star on message" })
  async toggleStar(@Param("id") id: string) {}

  // TODO: DELETE /mail/:id — soft delete (move to trash)
  @Delete(":id")
  @ApiOperation({ summary: "Move message to trash" })
  async delete(@Param("id") id: string) {}
}
