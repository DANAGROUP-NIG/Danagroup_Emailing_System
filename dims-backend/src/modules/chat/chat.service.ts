import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChatConversation } from "./entities/chat-conversation.entity";
import { ChatMessage } from "./entities/chat-message.entity";
import { SendChatMessageDto } from "./dto/send-chat-message.dto";
import { QueryChatDto } from "./dto/query-chat.dto";

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatConversation)
    private readonly convRepo: Repository<ChatConversation>,
    @InjectRepository(ChatMessage)
    private readonly msgRepo: Repository<ChatMessage>,
  ) {}

  // ─── Conversations ────────────────────────────────────────────────────────

  async getOrCreateConversation(userAId: string, userBId: string): Promise<ChatConversation> {
    const [a, b] = [userAId, userBId].sort();
    let conv = await this.convRepo.findOne({
      where: { participantAId: a, participantBId: b },
      relations: { participantA: true, participantB: true },
    });

    if (!conv) {
      conv = this.convRepo.create({ participantAId: a, participantBId: b });
      conv = await this.convRepo.save(conv);
      conv = await this.convRepo.findOne({
        where: { id: conv.id },
        relations: { participantA: true, participantB: true },
      }) as ChatConversation;
    }

    return conv;
  }

  async listConversations(userId: string) {
    const conversations = await this.convRepo
      .createQueryBuilder("conv")
      .leftJoinAndSelect("conv.participantA", "pA")
      .leftJoinAndSelect("conv.participantB", "pB")
      .where("conv.participantAId = :userId OR conv.participantBId = :userId", { userId })
      .orderBy("COALESCE(conv.lastMessageAt, conv.createdAt)", "DESC")
      .getMany();

    return Promise.all(
      conversations.map(async (conv) => {
        const unread = await this.msgRepo.count({
          where: { conversationId: conv.id, isRead: false, senderId: conv.participantAId === userId ? conv.participantBId : conv.participantAId },
        });
        const lastMessage = conv.lastMessageId
          ? await this.msgRepo.findOne({ where: { id: conv.lastMessageId } })
          : null;
        return { ...conv, unreadCount: unread, lastMessage };
      }),
    );
  }

  async getConversationById(conversationId: string, userId: string): Promise<ChatConversation> {
    const conv = await this.convRepo.findOne({
      where: { id: conversationId },
      relations: { participantA: true, participantB: true },
    });

    if (!conv) throw new NotFoundException("Conversation not found");
    if (conv.participantAId !== userId && conv.participantBId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    return conv;
  }

  // ─── Messages ─────────────────────────────────────────────────────────────

  async sendMessage(senderId: string, dto: SendChatMessageDto): Promise<ChatMessage> {
    const conv = await this.getOrCreateConversation(senderId, dto.recipientId);

    const message = this.msgRepo.create({
      conversationId: conv.id,
      senderId,
      body: dto.body.trim(),
    });

    const saved = await this.msgRepo.save(message);

    await this.convRepo.update(conv.id, {
      lastMessageId: saved.id,
      lastMessageAt: saved.createdAt,
    });

    return this.msgRepo.findOne({
      where: { id: saved.id },
      relations: { sender: true },
    }) as Promise<ChatMessage>;
  }

  async getMessages(conversationId: string, userId: string, query: QueryChatDto) {
    await this.getConversationById(conversationId, userId);

    const limit = Math.min(query.limit ?? 30, 100);

    const qb = this.msgRepo
      .createQueryBuilder("msg")
      .leftJoinAndSelect("msg.sender", "sender")
      .where("msg.conversationId = :conversationId", { conversationId })
      .orderBy("msg.createdAt", "DESC")
      .take(limit);

    if (query.before) {
      qb.andWhere("msg.createdAt < :before", { before: query.before });
    }

    const messages = await qb.getMany();
    return messages.reverse();
  }

  async markMessagesRead(conversationId: string, userId: string): Promise<void> {
    await this.getConversationById(conversationId, userId);

    await this.msgRepo
      .createQueryBuilder()
      .update()
      .set({ isRead: true, readAt: new Date() })
      .where("conversationId = :conversationId", { conversationId })
      .andWhere("senderId != :userId", { userId })
      .andWhere("isRead = false")
      .execute();
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await this.msgRepo
      .createQueryBuilder("msg")
      .innerJoin("msg.conversation", "conv")
      .where("msg.isRead = false")
      .andWhere("msg.senderId != :userId", { userId })
      .andWhere(
        "(conv.participantAId = :userId OR conv.participantBId = :userId)",
        { userId },
      )
      .getCount();
    return result;
  }
}
