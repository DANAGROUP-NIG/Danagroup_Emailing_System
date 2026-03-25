import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Message } from "./entities/message.entity";
import { Thread } from "./entities/thread.entity";
import { MessageRecipient } from "./entities/message-recipient.entity";

@Injectable()
export class MailService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Thread)
    private readonly threadRepo: Repository<Thread>,
    @InjectRepository(MessageRecipient)
    private readonly recipientRepo: Repository<MessageRecipient>,
    @InjectQueue("mail-delivery")
    private readonly mailQueue: Queue,
  ) {}

  // TODO: Implement getInbox(userId, query): paginated threads for user inbox
  // TODO: Implement getSent(userId, query): paginated sent messages
  // TODO: Implement getDrafts(userId, query): paginated drafts
  // TODO: Implement getThread(threadId, userId): all messages in thread (with auth check)
  // TODO: Implement send(dto, senderId): create Thread if new, create Message, create MessageRecipients,
  //   enqueue 'mail-delivery' job for notification dispatch, index in Elasticsearch
  // TODO: Implement saveDraft(dto, senderId): same as send but isDraft = true
  // TODO: Implement markRead(messageId, userId): set MessageRecipient.isRead = true, readAt = now
  // TODO: Implement toggleStar(messageId, userId): toggle MessageRecipient.isStarred
  // TODO: Implement delete(messageId, userId): set MessageRecipient.isDeleted = true
}
