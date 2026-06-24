import { Thread } from "../entities/thread.entity";
import { MailMapper } from "./mail.mapper";

export class InboxMapper {
  static toResponse(threads: Thread[], currentUserId: string) {
    return threads.map((thread) => {
      const userState = MailMapper.getUserState(thread, currentUserId);
      const latestIncoming =
        (thread.messages ?? []).find(
          (message) => message.senderId !== currentUserId,
        ) ?? MailMapper.getLatestMessage(thread);

      return {
        id: thread.id,
        subject: thread.subject,
        unreadCount: userState?.unreadCount ?? 0,
        isStarred: userState?.isStarred ?? false,
        updatedAt: thread.lastMessageAt ?? thread.lastActivityAt,
        latestMessage: latestIncoming
          ? MailMapper.toListMessage(latestIncoming, currentUserId)
          : null,
      };
    });
  }
}
