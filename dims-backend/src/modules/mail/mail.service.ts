import { Injectable } from "@nestjs/common";
import { MailQueryDto } from "./dto/mail-query.dto";
import { SaveDraftDto } from "./dto/save-draft.dto";
import { SendMailDto } from "./dto/send-mail.dto";
import { SendMailResponseDto } from "./dto/response/send-mail.response.dto";
import { MailboxService } from "./mailbox.service";
import { ComposeService } from "./compose.service";
import { MailActionService } from "./mail-action.service";

@Injectable()
export class MailService {
  constructor(
    private readonly mailboxService: MailboxService,
    private readonly composeService: ComposeService,
    private readonly mailActionService: MailActionService,
  ) {}

  getFolder(userIdentifier: string, folder: string, query: MailQueryDto) {
    return this.mailboxService.getFolder(userIdentifier, folder, query);
  }

  getInbox(userId: string, cursor?: string) {
    return this.mailboxService.getInbox(userId, cursor);
  }

  getSent(userEmail: string, query: MailQueryDto) {
    return this.mailboxService.getSent(userEmail, query);
  }

  getTrash(userId: string, query: MailQueryDto) {
    return this.mailboxService.getTrash(userId, query);
  }

  getDrafts(userId: string, query: MailQueryDto) {
    return this.mailboxService.getDrafts(userId, query);
  }

  getCounts(userId: string) {
    return this.mailboxService.getCounts(userId);
  }

  getThread(threadId: string, userId: string) {
    return this.mailboxService.getThread(threadId, userId);
  }

  getMessageById(messageId: string, userId: string) {
    return this.mailboxService.getMessageById(messageId, userId);
  }

  searchUserMail(userId: string, query: string, limit?: number) {
    return this.mailboxService.searchUserMail(userId, query, limit);
  }

  searchUserMailEs(userId: string, query: string, limit?: number) {
    return this.mailboxService.searchUserMailEs(userId, query, limit);
  }

  getInboxThreadsOptimized(userId: string, cursor?: string, limit?: number) {
    return this.mailboxService.getInboxThreadsOptimized(userId, cursor, limit);
  }

  getSentThreadsOptimized(userId: string, cursor?: string, limit?: number) {
    return this.mailboxService.getSentThreadsOptimized(userId, cursor, limit);
  }

  send(dto: SendMailDto, senderEmail: string): Promise<SendMailResponseDto> {
    return this.composeService.send(dto, senderEmail);
  }

  saveDraft(dto: SaveDraftDto, senderId: string) {
    return this.composeService.saveDraft(dto, senderId);
  }

  readMessage(messageId: string, userId: string) {
    return this.mailActionService.readMessage(messageId, userId);
  }

  markRead(messageId: string, userId: string, isRead?: boolean) {
    return this.mailActionService.markRead(messageId, userId, isRead);
  }

  markManyAsRead(messageIds: string[], userId: string) {
    return this.mailActionService.markManyAsRead(messageIds, userId);
  }

  markThreadAsRead(threadId: string, userId: string) {
    return this.mailActionService.markThreadAsRead(threadId, userId);
  }

  readThread(threadId: string, userId: string) {
    return this.mailActionService.readThread(threadId, userId);
  }

  toggleStar(messageId: string, userId: string, isStarred?: boolean) {
    return this.mailActionService.toggleStar(messageId, userId, isStarred);
  }

  toggleThreadStar(threadId: string, userId: string, isStarred?: boolean) {
    return this.mailActionService.toggleThreadStar(threadId, userId, isStarred);
  }

  moveToTrash(messageId: string, userId: string) {
    return this.mailActionService.moveToTrash(messageId, userId);
  }

  restoreFromTrash(messageId: string, userId: string) {
    return this.mailActionService.restoreFromTrash(messageId, userId);
  }

  permanentlyDelete(messageId: string, userId: string) {
    return this.mailActionService.permanentlyDelete(messageId, userId);
  }

  deleteDraft(draftId: string, userId: string) {
    return this.mailActionService.deleteDraft(draftId, userId);
  }

  emptyAllTrash(userId: string) {
    return this.mailActionService.emptyAllTrash(userId);
  }

  purgeExpiredTrash(olderThanDays?: number) {
    return this.mailActionService.purgeExpiredTrash(olderThanDays);
  }
}
