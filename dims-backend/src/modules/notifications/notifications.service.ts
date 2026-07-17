import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Notification, NotificationType } from "./entities/notification.entity";
import { QueryNotificationsDto } from "./dto/query-notifications.dto";

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body?: string,
    referenceId?: string,
  ): Promise<Notification> {
    const notification = this.notificationRepo.create({
      userId: userId,
      type,
      title,
      body,
      referenceId: referenceId,
    });

    return this.notificationRepo.save(notification);
  }

  async findAllForUser(userId: string, query: QueryNotificationsDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);

    const [data, total] = await this.notificationRepo.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async markAllRead(userId: string) {
    const result = await this.notificationRepo
      .createQueryBuilder()
      .update()
      .set({ isRead: true })
      .where("userId = :userId", { userId })
      .andWhere("isRead = false")
      .execute();

    return { updated: result.affected ?? 0 };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationRepo.count({
      where: { userId, isRead: false },
    });

    return { count };
  }

  async markRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepo.findOne({
      where: {
        id: notificationId,
        userId: userId,
      },
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    notification.isRead = true;
    await this.notificationRepo.save(notification);
  }

  async markReadByReference(referenceId: string, userId: string): Promise<void> {
    await this.notificationRepo
      .createQueryBuilder()
      .update()
      .set({ isRead: true })
      .where("userId = :userId", { userId })
      .andWhere("referenceId = :referenceId", { referenceId })
      .andWhere("isRead = false")
      .execute();
  }

  async deleteAll(userId: string) {
    const result = await this.notificationRepo
      .createQueryBuilder()
      .delete()
      .where("userId = :userId", { userId })
      .execute();

    return { deleted: result.affected ?? 0 };
  }
}
