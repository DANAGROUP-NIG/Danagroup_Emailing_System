import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import {
  DistributionList,
  DistributionListMember,
} from "./entities/distribution-list.entity";
import {
  AddMembersDto,
  CreateDistributionListDto,
  UpdateDistributionListDto,
} from "./dto/distribution-list.dto";
import { User } from "@modules/users/entities/user.entity";

@Injectable()
export class DistributionListsService {
  constructor(
    @InjectRepository(DistributionList)
    private readonly listRepo: Repository<DistributionList>,
    @InjectRepository(DistributionListMember)
    private readonly memberRepo: Repository<DistributionListMember>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(userId: string): Promise<DistributionList[]> {
    return this.listRepo
      .createQueryBuilder("list")
      .leftJoinAndSelect("list.members", "members")
      .leftJoinAndSelect("members.user", "user")
      .where("list.isPublic = true OR list.ownerId = :userId", { userId })
      .orderBy("list.name", "ASC")
      .getMany();
  }

  async findOne(id: string, userId: string): Promise<DistributionList> {
    const list = await this.listRepo.findOne({
      where: { id },
      relations: { members: { user: true }, owner: true },
    });
    if (!list) throw new NotFoundException("Distribution list not found");
    if (!list.isPublic && list.ownerId !== userId) {
      throw new ForbiddenException("Access denied");
    }
    return list;
  }

  async create(dto: CreateDistributionListDto, ownerId: string): Promise<DistributionList> {
    const existing = await this.listRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new BadRequestException("A list with this email already exists");

    const list = this.listRepo.create({
      ...dto,
      email: dto.email.toLowerCase(),
      ownerId,
      isPublic: dto.isPublic ?? false,
    });
    const saved = await this.listRepo.save(list);

    if (dto.memberIds?.length) {
      await this.addMembersToList(saved.id, dto.memberIds);
    }

    return this.findOne(saved.id, ownerId);
  }

  async update(id: string, dto: UpdateDistributionListDto, userId: string): Promise<DistributionList> {
    const list = await this.listRepo.findOne({ where: { id } });
    if (!list) throw new NotFoundException("Distribution list not found");
    if (list.ownerId !== userId) throw new ForbiddenException("Only the owner can edit this list");

    Object.assign(list, dto);
    await this.listRepo.save(list);
    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const list = await this.listRepo.findOne({ where: { id } });
    if (!list) throw new NotFoundException("Distribution list not found");
    if (list.ownerId !== userId) throw new ForbiddenException("Only the owner can delete this list");
    await this.listRepo.remove(list);
  }

  async addMembers(id: string, dto: AddMembersDto, userId: string): Promise<DistributionList> {
    const list = await this.listRepo.findOne({ where: { id } });
    if (!list) throw new NotFoundException("Distribution list not found");
    if (list.ownerId !== userId) throw new ForbiddenException("Only the owner can add members");

    await this.addMembersToList(id, dto.userIds);
    return this.findOne(id, userId);
  }

  async removeMember(id: string, targetUserId: string, requesterId: string): Promise<void> {
    const list = await this.listRepo.findOne({ where: { id } });
    if (!list) throw new NotFoundException("Distribution list not found");
    if (list.ownerId !== requesterId && targetUserId !== requesterId) {
      throw new ForbiddenException("Insufficient permissions");
    }
    await this.memberRepo.delete({ listId: id, userId: targetUserId });
  }

  async resolveEmails(listId: string): Promise<string[]> {
    const members = await this.memberRepo.find({
      where: { listId },
      relations: { user: true },
    });
    return members.map((m) => m.user?.email).filter(Boolean) as string[];
  }

  private async addMembersToList(listId: string, userIds: string[]): Promise<void> {
    const users = await this.userRepo.find({
      where: { id: In(userIds), isActive: true },
      select: ["id"],
    });

    const existingMembers = await this.memberRepo.find({
      where: { listId, userId: In(userIds) },
      select: ["userId"],
    });
    const existingIds = new Set(existingMembers.map((m) => m.userId));

    const newMembers = users
      .filter((u) => !existingIds.has(u.id))
      .map((u) => this.memberRepo.create({ listId, userId: u.id }));

    if (newMembers.length) await this.memberRepo.save(newMembers);
  }
}
