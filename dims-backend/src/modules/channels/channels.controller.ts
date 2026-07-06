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
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { ChannelsService } from "./channels.service";
import { CreateChannelDto } from "./dto/create-channel.dto";
import { SendChannelMessageDto } from "./dto/send-channel-message.dto";
import { QueryChatDto } from "@modules/chat/dto/query-chat.dto";

@ApiTags("channels")
@ApiBearerAuth()
@Controller("channels")
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  @ApiOperation({ summary: "List channels the current user belongs to" })
  listMine(@CurrentUser() user: { userId: string }) {
    return this.channelsService.listForUser(user.userId);
  }

  @Get("public")
  @ApiOperation({ summary: "List all public channels (browse)" })
  listPublic() {
    return this.channelsService.listPublic();
  }

  @Post()
  @ApiOperation({ summary: "Create a new channel" })
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateChannelDto,
  ) {
    return this.channelsService.create(user.userId, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get channel details and members" })
  getById(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.channelsService.getById(id, user.userId);
  }

  @Post(":id/join")
  @ApiOperation({ summary: "Join a public channel" })
  join(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.channelsService.join(id, user.userId);
  }

  @Delete(":id/leave")
  @ApiOperation({ summary: "Leave a channel" })
  leave(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.channelsService.leave(id, user.userId);
  }

  @Post(":id/members")
  @ApiOperation({ summary: "Add a member to a channel (admin/owner)" })
  addMember(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string },
    @Body("userId", ParseUUIDPipe) targetUserId: string,
  ) {
    return this.channelsService.addMember(id, user.userId, targetUserId);
  }

  @Delete(":id/members/:userId")
  @ApiOperation({ summary: "Remove a member from a channel (admin/owner)" })
  removeMember(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("userId", ParseUUIDPipe) targetUserId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.channelsService.removeMember(id, user.userId, targetUserId);
  }

  @Get(":id/messages")
  @ApiOperation({ summary: "Get messages for a channel (paginated)" })
  getMessages(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string },
    @Query() query: QueryChatDto,
  ) {
    return this.channelsService.getMessages(id, user.userId, query.before, query.limit);
  }

  @Post(":id/messages")
  @ApiOperation({ summary: "Send a message to a channel (REST fallback)" })
  sendMessage(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string },
    @Body("body") body: string,
  ) {
    return this.channelsService.sendMessage(user.userId, { channelId: id, body });
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark channel messages as read" })
  markRead(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.channelsService.markRead(id, user.userId);
  }
}
