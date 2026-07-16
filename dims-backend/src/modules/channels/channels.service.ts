import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Channel } from "./entities/channel.entity";
import { ChannelMember } from "./entities/channel-member.entity";
import { ChannelMessage } from "./entities/channel-message.entity";
import { CreateChannelDto } from "./dto/create-channel.dto";
import { SendChannelMessageDto } from "./dto/send-channel-message.dto";

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepo: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private readonly memberRepo: Repository<ChannelMember>,
    @InjectRepository(ChannelMessage)
    private readonly messageRepo: Repository<ChannelMessage>,
  ) {}

  // ─── Channels ─────────────────────────────────────────────────────────────

  async listForUser(userId: string) {
    const memberships = await this.memberRepo.find({
      where: { userId },
      select: ["channelId", "lastReadAt"],
    });

    if (!memberships.length) return [];

    const channelIds = memberships.map((m) => m.channelId);

    const channels = await this.channelRepo
      .createQueryBuilder("ch")
      .leftJoinAndSelect("ch.createdBy", "creator")
      .where("ch.id IN (:...channelIds)", { channelIds })
      .andWhere("ch.isArchived = false")
      .orderBy("COALESCE(ch.lastMessageAt, ch.createdAt)", "DESC")
      .getMany();

    return Promise.all(
      channels.map(async (ch) => {
        const membership = memberships.find((m) => m.channelId === ch.id)!;
        const unread = membership.lastReadAt
          ? await this.messageRepo
              .createQueryBuilder("msg")
              .where("msg.channelId = :id", { id: ch.id })
              .andWhere("msg.senderId != :userId", { userId })
              .andWhere("msg.createdAt > :lastRead", {
                lastRead: membership.lastReadAt,
              })
              .getCount()
          : await this.messageRepo.count({ where: { channelId: ch.id } });

        const lastMessage = ch.lastMessageId
          ? await this.messageRepo.findOne({
              where: { id: ch.lastMessageId },
              relations: { sender: true },
            })
          : null;

        const memberCount = await this.memberRepo.count({
          where: { channelId: ch.id },
        });

        return { ...ch, unreadCount: unread, lastMessage, memberCount };
      }),
    );
  }

  async listPublic() {
    return this.channelRepo.find({
      where: { type: "public", isArchived: false },
      relations: { createdBy: true },
      order: { createdAt: "DESC" },
    });
  }

  async getById(channelId: string, userId: string) {
    const channel = await this.channelRepo.findOne({
      where: { id: channelId },
      relations: { createdBy: true },
    });
    if (!channel) throw new NotFoundException("Channel not found");

    if (channel.type === "private") {
      await this.requireMembership(channelId, userId);
    }

    const members = await this.memberRepo.find({
      where: { channelId },
      relations: { user: true },
    });

    return { ...channel, members };
  }

  async create(userId: string, dto: CreateChannelDto): Promise<Channel> {
    const channel = this.channelRepo.create({
      name: dto.name.trim(),
      description: dto.description ?? null,
      type: dto.type ?? "public",
      createdById: userId,
    });

    const saved = await this.channelRepo.save(channel);

    // Add creator as owner
    const memberIds = new Set<string>([userId, ...(dto.memberIds ?? [])]);
    const memberEntries = [...memberIds].map((uid) =>
      this.memberRepo.create({
        channelId: saved.id,
        userId: uid,
        role: uid === userId ? "owner" : "member",
      }),
    );
    await this.memberRepo.save(memberEntries);

    return saved;
  }

  async join(channelId: string, userId: string): Promise<void> {
    const channel = await this.channelRepo.findOne({
      where: { id: channelId },
    });
    if (!channel) throw new NotFoundException("Channel not found");
    if (channel.type === "private")
      throw new ForbiddenException("This is a private channel");

    const existing = await this.memberRepo.findOne({
      where: { channelId, userId },
    });
    if (existing) return;

    await this.memberRepo.save(
      this.memberRepo.create({ channelId, userId, role: "member" }),
    );
  }

  async leave(channelId: string, userId: string): Promise<void> {
    const member = await this.memberRepo.findOne({
      where: { channelId, userId },
    });
    if (!member) throw new NotFoundException("Not a member of this channel");
    await this.memberRepo.remove(member);
  }

  async addMember(
    channelId: string,
    requesterId: string,
    targetUserId: string,
  ): Promise<void> {
    const member = await this.requireMembership(channelId, requesterId);
    if (member.role === "member")
      throw new ForbiddenException("Only admins/owners can add members");

    const existing = await this.memberRepo.findOne({
      where: { channelId, userId: targetUserId },
    });
    if (existing) return;

    await this.memberRepo.save(
      this.memberRepo.create({
        channelId,
        userId: targetUserId,
        role: "member",
      }),
    );
  }

  async removeMember(
    channelId: string,
    requesterId: string,
    targetUserId: string,
  ): Promise<void> {
    const requester = await this.requireMembership(channelId, requesterId);
    if (requester.role === "member")
      throw new ForbiddenException("Only admins/owners can remove members");

    const target = await this.memberRepo.findOne({
      where: { channelId, userId: targetUserId },
    });
    if (!target) return;
    await this.memberRepo.remove(target);
  }

  // ─── Messages ─────────────────────────────────────────────────────────────

  async sendMessage(
    senderId: string,
    dto: SendChannelMessageDto,
  ): Promise<ChannelMessage> {
    await this.requireMembership(dto.channelId, senderId);

    const msg = this.messageRepo.create({
      channelId: dto.channelId,
      senderId,
      body: dto.body.trim(),
    });

    const saved = await this.messageRepo.save(msg);

    await this.channelRepo.update(dto.channelId, {
      lastMessageId: saved.id,
      lastMessageAt: saved.createdAt,
    });

    return this.messageRepo.findOne({
      where: { id: saved.id },
      relations: { sender: true },
    }) as Promise<ChannelMessage>;
  }

  async getMessages(
    channelId: string,
    userId: string,
    before?: string,
    limit = 30,
  ) {
    await this.requireMembership(channelId, userId);

    const qb = this.messageRepo
      .createQueryBuilder("msg")
      .leftJoinAndSelect("msg.sender", "sender")
      .where("msg.channelId = :channelId", { channelId })
      .orderBy("msg.createdAt", "DESC")
      .take(Math.min(limit, 100));

    if (before) qb.andWhere("msg.createdAt < :before", { before });

    const messages = await qb.getMany();
    return messages.reverse();
  }

  async markRead(channelId: string, userId: string): Promise<void> {
    await this.requireMembership(channelId, userId);
    await this.memberRepo.update(
      { channelId, userId },
      { lastReadAt: new Date() },
    );
  }

  async getMemberIds(channelId: string): Promise<string[]> {
    const members = await this.memberRepo.find({
      where: { channelId },
      select: ["userId"],
    });
    return members.map((m) => m.userId);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async requireMembership(
    channelId: string,
    userId: string,
  ): Promise<ChannelMember> {
    const member = await this.memberRepo.findOne({
      where: { channelId, userId },
    });
    if (!member) throw new ForbiddenException("Not a member of this channel");
    return member;
  }
}
