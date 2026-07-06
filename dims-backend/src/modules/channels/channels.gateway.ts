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
import { ChannelsService } from "./channels.service";
import { SendChannelMessageDto } from "./dto/send-channel-message.dto";

type SocketUser = { userId: string; email?: string };

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
  namespace: "/channels",
  pingInterval: 25000,
  pingTimeout: 20000,
})
export class ChannelsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChannelsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly channelsService: ChannelsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const user = await this.authenticate(client);
      client.data.user = user;

      // Auto-join socket rooms for all the user's channels
      const channels = await this.channelsService.listForUser(user.userId);
      await Promise.all(channels.map((ch) => client.join(this.channelRoom(ch.id))));

      client.emit("connected", { userId: user.userId });
    } catch {
      client.emit("error", { message: "authentication_failed" });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Channels client disconnected: ${client.id}`);
  }

  @SubscribeMessage("channel:join")
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string },
  ) {
    const user = this.requireAuth(client);
    await this.channelsService.join(body.channelId, user.userId);
    await client.join(this.channelRoom(body.channelId));
    return { ok: true };
  }

  @SubscribeMessage("channel:send")
  async handleSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendChannelMessageDto,
  ) {
    const user = this.requireAuth(client);

    const message = await this.channelsService.sendMessage(user.userId, dto);

    const payload = {
      id: message.id,
      channelId: message.channelId,
      senderId: message.senderId,
      body: message.body,
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

    this.server.to(this.channelRoom(dto.channelId)).emit("channel:message", payload);
    return payload;
  }

  @SubscribeMessage("channel:read")
  async handleRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string },
  ) {
    const user = this.requireAuth(client);
    await this.channelsService.markRead(body.channelId, user.userId);
    return { ok: true };
  }

  emitToChannel(channelId: string, event: string, payload: Record<string, unknown>) {
    this.server.to(this.channelRoom(channelId)).emit(event, payload);
  }

  private channelRoom(channelId: string) {
    return `channel:${channelId}`;
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
