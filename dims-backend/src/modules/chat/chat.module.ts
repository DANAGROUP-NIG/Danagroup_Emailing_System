import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@modules/auth/auth.module";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { ChatGateway } from "./chat.gateway";
import { ChatConversation } from "./entities/chat-conversation.entity";
import { ChatMessage } from "./entities/chat-message.entity";

@Module({
  imports: [
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([ChatConversation, ChatMessage]),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
