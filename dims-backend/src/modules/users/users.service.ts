import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { User } from "./entities/user.entity";


interface FindAllParams {
  page?: number;
  limit?: number;
  email?: string;
  role?: string;
  is_active?: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // TODO: Implement findAll(filters): paginated list of users
  async findAll(params: FindAllParams) {
    const {
      page = 1,
      limit = 10,
      email,
      role,
      is_active,
    } = params

    const where: any = {};

    if (email) where.email = ILike(`%${email}%`);
    if (role) where.role = role;
    if(is_active) where.is_active = is_active;

    const [data, total] = await this.userRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: "DESC"},
    });

    return {
      data,
      total,
      page,
      lastpage: Math.ceil(total/limit),
    }

  }
  // TODO: Implement findById(id): User
  async findByID(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  // TODO: Implement findByEmail(email): User | null (used by AuthService)
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email },
    });
  }
  // TODO: Implement search(query): User[] (for RecipientInput autocomplete)
  async search(query: string): Promise<User[]> {
    if (!query) return [];

    return this.userRepo.find({
      where: [
        { email: ILike(`%${query}%`) },
        { name: ILike(`%${query}%`) },
      ],
      take: 10, //limit autocomplete results
      order: { createdAt: "DESC"},
    });
  }
  // TODO: Implement create(dto): User (admin only)
  async create(dto: Partial<User>): Promise<User> {
    const user = this.userRepo.create(dto);
    return this.userRepo.save(user);
  }
  // TODO: Implement update(id, dto): User (admin or self)
  async update(id: string, dto: Partial<User>): Promise<User> {
    const user = await this.findByID(id);

    Object.assign(user, dto);
    return this.userRepo.save(user);
  }
  // TODO: Implement deactivate(id): void (admin only, sets is_active = false)
  async deactivate(id: string): Promise<void> {
    const user = await this.findByID(id);

    user.isActive = false;
    await this.userRepo.save(user);
  }
}
