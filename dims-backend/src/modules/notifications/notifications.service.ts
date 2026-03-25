import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Notification } from "./entities/notification.entity";

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  // TODO: Implement create(userId, type, title, body, referenceId): Notification
  // TODO: Implement findByUser(userId): paginated notifications
  // TODO: Implement markRead(notificationId, userId): void
  // TODO: Implement markAllRead(userId): void
  // TODO: Implement getUnreadCount(userId): number
}
