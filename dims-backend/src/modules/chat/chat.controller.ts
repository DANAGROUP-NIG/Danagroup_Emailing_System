import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { ChatService } from "./chat.service";
import { SendChatMessageDto } from "./dto/send-chat-message.dto";
import { QueryChatDto } from "./dto/query-chat.dto";

@ApiTags("chat")
@ApiBearerAuth()
@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get("conversations")
  @ApiOperation({ summary: "List all conversations for the current user" })
  listConversations(@CurrentUser() user: { userId: string }) {
    return this.chatService.listConversations(user.userId);
  }

  @Post("conversations")
  @ApiOperation({ summary: "Get or create a 1-on-1 conversation" })
  getOrCreate(
    @CurrentUser() user: { userId: string },
    @Body("recipientId", ParseUUIDPipe) recipientId: string,
  ) {
    return this.chatService.getOrCreateConversation(user.userId, recipientId);
  }

  @Get("conversations/:id/messages")
  @ApiOperation({ summary: "Get messages for a conversation (paginated)" })
  getMessages(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string },
    @Query() query: QueryChatDto,
  ) {
    return this.chatService.getMessages(id, user.userId, query);
  }

  @Patch("conversations/:id/read")
  @ApiOperation({ summary: "Mark all messages in a conversation as read" })
  markRead(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.chatService.markMessagesRead(id, user.userId);
  }

  @Post("messages")
  @ApiOperation({ summary: "Send a chat message (REST fallback)" })
  sendMessage(
    @CurrentUser() user: { userId: string },
    @Body() dto: SendChatMessageDto,
  ) {
    return this.chatService.sendMessage(user.userId, dto);
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Get total unread chat message count" })
  async getUnreadCount(@CurrentUser() user: { userId: string }) {
    const count = await this.chatService.getUnreadCount(user.userId);
    return { count };
  }
}
