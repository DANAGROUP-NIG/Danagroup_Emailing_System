import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Logger } from "@nestjs/common";
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
import { USER_STATUS } from "../../jobs/queue.constants";

type SocketUser = {
  userId: string;
  email?: string;
  role?: string;
};

type SubscribePayload = {
  room?: string;
};

export type MailboxChangedPayload = {
  action:
    | "message_sent"
    | "message_received"
    | "draft_saved"
    | "read_state_changed"
    | "star_state_changed"
    | "moved_to_trash"
    | "restored_from_trash"
    | "permanently_deleted"
    | "trash_emptied"
    | "draft_deleted";
  messageId?: string;
  messageIds?: string[];
  threadId?: string;
  threadIds?: string[];
  folders?: string[];
  timestamp?: string;
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
  namespace: "/notifications",
  pingInterval: 25000,
  pingTimeout: 20000,
})
export class MailGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MailGateway.name);
  private readonly presence = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const user = await this.authenticate(client);
      client.data.user = user;

      const room = this.getUserRoom(user.userId);
      await client.join(room);
      this.trackConnection(user.userId, client.id);

      client.emit("system", {
        type: "system",
        message: "connected",
        userId: user.userId,
      });

      this.emitUserStatus(user.userId, USER_STATUS.ONLINE);
    } catch (error) {
      this.logger.warn(
        `Rejected websocket connection ${client.id}: ${error instanceof Error ? error.message : "Unauthorized"}`,
      );
      client.emit("system", {
        type: "system",
        message: "authentication_failed",
        reconnectable: true,
      });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user as SocketUser | undefined;
    if (!user?.userId) {
      return;
    }

    this.untrackConnection(user.userId, client.id);

    if (!this.presence.has(user.userId)) {
      this.emitUserStatus(user.userId, USER_STATUS.OFFLINE);
    }
  }

  @SubscribeMessage("subscribe")
  async handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SubscribePayload,
  ) {
    const user = this.requireAuthenticatedUser(client);
    const room = payload?.room?.trim() || this.getUserRoom(user.userId);

    if (room !== this.getUserRoom(user.userId)) {
      throw new WsException("You can only subscribe to your own room");
    }

    await client.join(room);
    return {
      event: "subscribed",
      data: { room },
    };
  }

  @SubscribeMessage("ping")
  handlePing(@ConnectedSocket() client: Socket) {
    this.requireAuthenticatedUser(client);
    return {
      event: "pong",
      data: { timestamp: new Date().toISOString() },
    };
  }

  emitNewMail(userId: string, payload: Record<string, unknown>) {
    this.emitEventToUser(userId, "new_mail", payload);
  }

  emitNotification(userId: string, payload: Record<string, unknown>) {
    this.emitEventToUser(userId, "notification", payload);
  }

  emitAnnouncement(userId: string, payload: Record<string, unknown>) {
    this.emitEventToUser(userId, "announcement", payload);
  }

  emitSystem(userId: string, payload: Record<string, unknown>) {
    this.emitEventToUser(userId, "system", payload);
  }

  emitMailRead(userId: string, payload: Record<string, unknown>) {
    this.emitEventToUser(userId, "mail_read", payload);
  }

  emitMailboxChanged(userId: string, payload: MailboxChangedPayload) {
    this.emitEventToUser(userId, "mailbox_changed", {
      ...payload,
      timestamp: payload.timestamp ?? new Date().toISOString(),
    });
  }

  emitUserStatus(userId: string, status: string) {
    this.emitEventToUser(userId, "user_status", {
      userId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  emitEventToUser(
    userId: string,
    event: string,
    payload: Record<string, unknown>,
  ) {
    this.server.to(this.getUserRoom(userId)).emit(event, payload);
  }

  private getUserRoom(userId: string) {
    return `user:${userId}`;
  }

  private requireAuthenticatedUser(client: Socket) {
    const user = client.data.user as SocketUser | undefined;
    if (!user?.userId) {
      throw new WsException("Unauthorized");
    }

    return user;
  }

  private async authenticate(client: Socket): Promise<SocketUser> {
    const token = this.extractToken(client);
    if (!token) {
      throw new WsException("Missing authentication token");
    }

    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>("JWT_SECRET"),
    });

    if (!payload?.sub) {
      throw new WsException("Invalid authentication token");
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }

  private extractToken(client: Socket): string | null {
    const authToken =
      typeof client.handshake.auth?.token === "string"
        ? client.handshake.auth.token
        : null;

    if (authToken) {
      return authToken.replace(/^Bearer\s+/i, "");
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === "string" && header.trim()) {
      return header.replace(/^Bearer\s+/i, "");
    }

    const cookieHeader = client.handshake.headers.cookie;
    if (typeof cookieHeader === "string") {
      const match = cookieHeader
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("access_token="));
      if (match) {
        return decodeURIComponent(match.slice("access_token=".length));
      }
    }

    return null;
  }

  private trackConnection(userId: string, socketId: string) {
    const sockets = this.presence.get(userId) ?? new Set<string>();
    sockets.add(socketId);
    this.presence.set(userId, sockets);
  }

  private untrackConnection(userId: string, socketId: string) {
    const sockets = this.presence.get(userId);
    if (!sockets) {
      return;
    }

    sockets.delete(socketId);
    if (sockets.size === 0) {
      this.presence.delete(userId);
    }
  }
}
