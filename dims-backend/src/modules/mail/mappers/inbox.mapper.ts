import { Thread } from "../entities/thread.entity";
import { MailMapper } from "./mail.mapper";

export class InboxMapper {
  static toResponse(threads: Thread[], currentUserId: string) {
    return threads.map((thread) =>
      MailMapper.toThreadBase(thread, currentUserId),
    );
  }
}
