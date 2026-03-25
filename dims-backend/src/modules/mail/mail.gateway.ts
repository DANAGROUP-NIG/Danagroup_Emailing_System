import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

// TODO: Implement WebSocket Gateway
// - Namespace: /notifications
// - Auth: verify JWT from handshake.auth.token on connection
// - On connect: join room userId
// - Event 'subscribe': join user-specific room
// - Method emitNewMail(userId, message): emit 'new_mail' to user room
// - Method emitNotification(userId, notification): emit 'notification' to user room

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/notifications" })
export class MailGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // TODO: Validate JWT from client.handshake.auth.token
    // TODO: Join room based on userId from JWT
  }

  handleDisconnect(client: Socket) {
    // TODO: Clean up
  }

  @SubscribeMessage("subscribe")
  handleSubscribe(client: Socket, payload: { userId: string }) {
    // TODO: Join user room
  }

  emitNewMail(userId: string, payload: any) {
    this.server.to(userId).emit("new_mail", payload);
  }

  emitNotification(userId: string, payload: any) {
    this.server.to(userId).emit("notification", payload);
  }
}
