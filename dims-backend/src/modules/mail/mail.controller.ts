import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { MailService } from "./mail.service";
import { MailQueryDto } from "./dto/mail-query.dto";
import { SendMailDto } from "./dto/send-mail.dto";
import { SaveDraftDto } from "./dto/save-draft.dto";
import { UpdateMessageStatusDto } from "./dto/update-message-status.dto";
import { SendMailResponseDto } from "./dto/response/send-mail.response.dto";

type SendMailEnvelope = {
  success: true;
  data: SendMailResponseDto;
};

@ApiTags("mail")
@ApiBearerAuth()
@Controller("mail")
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get("inbox")
  @ApiOperation({ summary: "Get inbox threads for the current user" })
  async getInbox(
    @CurrentUser() user: { userId: string },
    @Query() query: MailQueryDto,
  ) {
    return this.mailService.getFolder(user.userId, "inbox", query);
  }

  @Get("sent")
  @ApiOperation({ summary: "Get sent messages for the current user" })
  async getSent(
    @CurrentUser() user: { userId: string },
    @Query() query: MailQueryDto,
  ) {
    return this.mailService.getFolder(user.userId, "sent", query);
  }

  @Get("counts")
  @ApiOperation({ summary: "Get mail counts (e.g. drafts) for the current user" })
  async getCounts(@CurrentUser() user: { userId: string }) {
    return this.mailService.getCounts(user.userId);
  }

  @Get("drafts")
  @ApiOperation({ summary: "Get draft messages for the current user" })
  async getDrafts(
    @CurrentUser() user: { userId: string },
    @Query() query: MailQueryDto,
  ) {
    return this.mailService.getDrafts(user.userId, query);
  }

  @Get("starred")
  @ApiOperation({ summary: "Get starred messages for the current user" })
  async getStarred(
    @CurrentUser() user: { userId: string },
    @Query() query: MailQueryDto,
  ) {
    return this.mailService.getFolder(user.userId, "starred", query);
  }

  @Get("thread/:threadId")
  @ApiOperation({ summary: "Get all visible messages in a thread" })
  async getThread(
    @CurrentUser() user: { userId: string },
    @Param("threadId") threadId: string,
  ) {
    return this.mailService.getThread(threadId, user.userId);
  }

  @Post("send")
  @ApiOperation({ summary: "Send a new message or send an existing draft" })
  @ApiResponse({ status: 201, type: SendMailResponseDto })
  async send(
    @CurrentUser() user: { userId: string; email: string },
    @Body() dto: SendMailDto,
  ): Promise<SendMailEnvelope> {
    const data = await this.mailService.send(dto, user.email);

    return {
      success: true,
      data,
    };
  }

  @Post("draft")
  @ApiOperation({ summary: "Create or update a draft message" })
  async saveDraft(
    @CurrentUser() user: { userId: string },
    @Body() dto: SaveDraftDto,
  ) {
    return this.mailService.saveDraft(dto, user.userId);
  }

  // Manual trigger
  @Patch("messages/:id/read")
  @ApiOperation({ summary: "Mark a message as read or unread" })
  async markRead(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Body() dto: UpdateMessageStatusDto,
  ) {
    return this.mailService.markRead(id, user.userId, dto.isRead);
  }

  @Get("messages/:messageId/read")
  @ApiOperation({ summary: "Mark a message as read and return its details" })
  readMessage(
    @Param("messageId") messageId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.mailService.readMessage(messageId, user.userId);
  }

  @Patch("messages/read")
  @ApiOperation({ summary: "Mark many messages as read or unread" })
  markManyAsRead(
    @Body("messageIds") messageIds: string[],
    @CurrentUser() user: { userId: string },
  ) {
    return this.mailService.markManyAsRead(messageIds, user.userId);
  }

  @Get("threads/:threadId")
  @ApiOperation({
    summary: "Mark all messages in a thread as read and return thread details",
  })
  readThread(
    @Param("threadId", new ParseUUIDPipe()) threadId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.mailService.readThread(threadId, user.userId);
  }

  // Manual trigger
  @Patch("threads/:threadId/read")
  @ApiOperation({ summary: "Mark thread as read or unread" })
  markThreadAsRead(
    @Param("threadId") threadId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.mailService.markThreadAsRead(threadId, user.userId);
  }

  @Patch(":id/star")
  @ApiOperation({ summary: "Star or unstar a message" })
  async toggleStar(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Body() dto: UpdateMessageStatusDto,
  ) {
    return this.mailService.toggleStar(id, user.userId, dto.isStarred);
  }

  @Patch("threads/:threadId/star")
  @ApiOperation({ summary: "Star or unstar a thread" })
  async toggleThreadStar(
    @CurrentUser() user: { userId: string },
    @Param("threadId", new ParseUUIDPipe()) threadId: string,
    @Body() dto: UpdateMessageStatusDto,
  ) {
    return this.mailService.toggleThreadStar(
      threadId,
      user.userId,
      dto.isStarred,
    );
  }

  @Delete("trash/empty")
  @ApiOperation({ summary: "Permanently delete all messages in trash" })
  async emptyAll(@CurrentUser() user: { userId: string }) {
    return this.mailService.emptyAllTrash(user.userId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Move a message to trash" })
  async delete(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
  ) {
    return this.mailService.moveToTrash(id, user.userId);
  }

  @Get("trash")
  @ApiOperation({ summary: "Get trashed messages" })
  async getTrash(
    @CurrentUser() user: { userId: string },
    @Query() query: MailQueryDto,
  ) {
    return this.mailService.getFolder(user.userId, "trash", query);
  }

  @Patch(":id/restore")
  @ApiOperation({ summary: "Restore message from trash" })
  async restore(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
  ) {
    return this.mailService.restoreFromTrash(id, user.userId);
  }

  @Get("messages/:id")
  @ApiOperation({
    summary: " return a single message by ID, including its recipients.",
  })
  async getMessage(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.mailService.getMessageById(id, user.userId);
  }

  @Delete("messages/:id/permanent")
  @ApiOperation({ summary: "Permanently delete a specific message" })
  async deletePermanent(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
  ) {
    return this.mailService.permanentlyDelete(id, user.userId);
  }

  @Delete("drafts/:id")
  @ApiOperation({ summary: "Delete a draft message" })
  async deleteDraft(
    @CurrentUser() user: { userId: string },
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.mailService.deleteDraft(id, user.userId);
  }
}
