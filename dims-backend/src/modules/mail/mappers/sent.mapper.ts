import { Thread } from "../entities/thread.entity";
import { Message } from "../entities/message.entity";
import { MailMapper } from "./mail.mapper";

export class SentMapper {
  static toResponse(threads: Thread[], currentUserId: string) {
    const sentMessages = threads.flatMap((thread) =>
      (thread.messages ?? [])
        .filter(
          (message) =>
            message.senderId === currentUserId &&
            !message.isDraft &&
            !message.senderDeletedAt,
        )
        .map((message) => ({
          id: message.id,
          subject: message.subject || thread.subject,
          unreadCount: 0,
          isStarred: false,
          updatedAt: message.sentAt ?? message.createdAt,
          latestMessage: MailMapper.toListMessage(message, currentUserId),
        })),
    );

    return sentMessages.sort((left, right) => {
      const leftDate = SentMapper.getMessageDate(left.latestMessage);
      const rightDate = SentMapper.getMessageDate(right.latestMessage);
      return rightDate.getTime() - leftDate.getTime();
    });
  }

  private static getMessageDate(
    message: Pick<Message, "sentAt" | "createdAt">,
  ) {
    return message.sentAt ?? message.createdAt;
  }
}
