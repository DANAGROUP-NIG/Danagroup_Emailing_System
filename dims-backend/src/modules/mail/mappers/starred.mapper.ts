import { Message } from "../entities/message.entity";
import { MailMapper } from "./mail.mapper";

export class StarredMapper {
  static toResponse(messages: Message[], currentUserId: string) {
    return messages.map((message) => {
      const currentRecipient =
        message.recipients?.find(
          (recipient) => recipient.recipientId === currentUserId,
        ) ?? null;

      return {
        id: message.id,
        subject: message.subject || message.thread?.subject || "No Subject",
        unreadCount: currentRecipient?.isRead ? 0 : 1,
        isStarred: true,
        updatedAt: message.sentAt ?? message.createdAt,
        latestMessage: MailMapper.toListMessage(message, currentUserId),
      };
    });
  }
}
