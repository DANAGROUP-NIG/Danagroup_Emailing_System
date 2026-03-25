import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // TODO: Implement findAll(filters): paginated list of users
  // TODO: Implement findById(id): User
  // TODO: Implement findByEmail(email): User | null (used by AuthService)
  // TODO: Implement search(query): User[] (for RecipientInput autocomplete)
  // TODO: Implement create(dto): User (admin only)
  // TODO: Implement update(id, dto): User (admin or self)
  // TODO: Implement deactivate(id): void (admin only, sets is_active = false)
}
