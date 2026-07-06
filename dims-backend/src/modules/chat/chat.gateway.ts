import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ChatService } from "./chat.service";
import { SendChatMessageDto } from "./dto/send-chat-message.dto";

type SocketUser = {
  userId: string;
  email?: string;
};

function isOriginAllowed(origin: string, patterns: string[]): boolean {
  return patterns.some((p) =>
    p.startsWith("*.") ? origin.endsWith(p.slice(1)) : origin === p,
  );
}

@WebSocketGateway({
  cors: {
    origin: (
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      const allowed = (process.env.FRONTEND_URL ?? "http://localhost:3000")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);
      if (!requestOrigin || isOriginAllowed(requestOrigin, allowed)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  },
  namespace: "/chat",
  pingInterval: 25000,
  pingTimeout: 20000,
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const user = await this.authenticate(client);
      client.data.user = user;
      await client.join(this.userRoom(user.userId));
      client.emit("connected", { userId: user.userId });
    } catch {
      client.emit("error", { message: "authentication_failed" });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user as SocketUser | undefined;
    this.logger.debug(`Chat client disconnected: ${user?.userId ?? client.id}`);
  }

  @SubscribeMessage("chat:send")
  async handleSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendChatMessageDto,
  ) {
    const user = this.requireAuth(client);

    const message = await this.chatService.sendMessage(user.userId, dto);

    const payload = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      body: message.body,
      isRead: message.isRead,
      createdAt: message.createdAt,
      sender: message.sender
        ? {
            id: message.sender.id,
            firstName: message.sender.firstName,
            lastName: message.sender.lastName,
            avatarUrl: message.sender.avatarUrl,
          }
        : null,
    };

    // Emit to sender
    client.emit("chat:message", payload);

    // Emit to recipient
    this.server.to(this.userRoom(dto.recipientId)).emit("chat:message", payload);

    return payload;
  }

  @SubscribeMessage("chat:read")
  async handleRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: string },
  ) {
    const user = this.requireAuth(client);
    await this.chatService.markMessagesRead(body.conversationId, user.userId);

    // Notify the other party their messages were read
    const conv = await this.chatService.getConversationById(body.conversationId, user.userId);
    const otherId =
      conv.participantAId === user.userId ? conv.participantBId : conv.participantAId;

    this.server.to(this.userRoom(otherId)).emit("chat:read", {
      conversationId: body.conversationId,
      readBy: user.userId,
    });

    return { ok: true };
  }

  emitToUser(userId: string, event: string, payload: Record<string, unknown>) {
    this.server.to(this.userRoom(userId)).emit(event, payload);
  }

  private userRoom(userId: string) {
    return `chat:${userId}`;
  }

  private requireAuth(client: Socket): SocketUser {
    const user = client.data.user as SocketUser | undefined;
    if (!user?.userId) throw new WsException("Unauthorized");
    return user;
  }

  private async authenticate(client: Socket): Promise<SocketUser> {
    const token = this.extractToken(client);
    if (!token) throw new WsException("Missing token");

    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>("JWT_SECRET"),
    });

    if (!payload?.sub) throw new WsException("Invalid token");
    return { userId: payload.sub, email: payload.email };
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth?.token;
    if (typeof auth === "string") return auth.replace(/^Bearer\s+/i, "");

    const header = client.handshake.headers.authorization;
    if (typeof header === "string") return header.replace(/^Bearer\s+/i, "");

    const cookie = client.handshake.headers.cookie;
    if (typeof cookie === "string") {
      const match = cookie.split(";").map((c) => c.trim()).find((c) => c.startsWith("access_token="));
      if (match) return decodeURIComponent(match.slice("access_token=".length));
    }

    return null;
  }
}
