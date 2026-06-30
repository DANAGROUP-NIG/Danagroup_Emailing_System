import {
  BadRequestException,
  forwardRef,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import { User, UserRole } from "./entities/user.entity";
import { QueryUserDto } from "./dto/query-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { JobsService } from "@jobs/jobs.service";
import { UsersSearchService } from "./users-search.service";
import { Department } from "@modules/departments/entities/department.entity";
import { Subsidiary } from "@modules/departments/entities/subsidiary.entity";
import * as bcrypt from "bcrypt";
import { MailService } from "@modules/mail/mail.service";
import { StorageService } from "@modules/storage/storage.service";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Department)
    private readonly departRepo: Repository<Department>,

    @InjectRepository(Subsidiary)
    private readonly subsidiaryRepo: Repository<Subsidiary>,

    private readonly jobsService: JobsService,
    private readonly usersSearch: UsersSearchService,
    private readonly storageService: StorageService,

    @Inject(forwardRef(() => MailService))
    private readonly mailService: MailService,
  ) {}

  private readonly logger = new Logger(UsersService.name);

  private handleError(method: string, error: Error & { stack?: string }) {
    // Do not mask NestJS known exceptions (BadRequestException, etc.)
    this.logger.error(
      `UsersService.${method} failed: ${error.message}`,
      error.stack,
    );
    throw error;
  }

  async updateSessions(id: string, sessions: User["sessions"]): Promise<void> {
    await this.userRepo.update(id, { sessions });
  }

  async updateAuthState(
    id: string,
    data: Partial<Pick<User, "sessions" | "lastLoginAt">>,
  ): Promise<void> {
    await this.userRepo.update(id, data);
  }

  async findAll(query: QueryUserDto) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const { search, department, subsidiary, role, sortBy } = query;

      const allowedSortColumns = ["firstName", "lastName", "createdAt"] as const;
      const sortColumn: string = allowedSortColumns.includes(
        sortBy as (typeof allowedSortColumns)[number],
      )
        ? sortBy
        : "firstName";

      const qb = this.userRepo
        .createQueryBuilder("user")
        .select([
          "user.id",
          "user.email",
          "user.firstName",
          "user.lastName",
          "user.role",
          "user.jobTitle",
          "user.avatarUrl",
          "user.isActive",
          "user.departmentId",
          "user.subsidiaryId",
          "user.lastLoginAt",
          "user.createdAt",
          "user.updatedAt",
        ]);

      if (search) {
        qb.andWhere(
          new Brackets((wb) => {
            wb.where("user.firstName ILIKE :search", {
              search: `%${search}%`,
            })
              .orWhere("user.lastName ILIKE :search", {
                search: `%${search}%`,
              })
              .orWhere("user.email ILIKE :search", {
                search: `%${search}%`,
              });
          }),
        );
      }

      if (department) {
        qb.andWhere("user.departmentId = :department", { department });
      }
      if (subsidiary) {
        qb.andWhere("user.subsidiaryId = :subsidiary", { subsidiary });
      }
      if (role) {
        qb.andWhere("user.role = :role", { role });
      }

      qb.orderBy(`user.${sortColumn}`, "ASC")
        .skip((page - 1) * limit)
        .take(limit);

      const [data, total] = await qb.getManyAndCount();

      const resolved = data.map((u) => ({
        ...u,
        avatarUrl: this.storageService.resolveAvatarUrl(u.avatarUrl) ?? undefined,
      }));

      return {
        data: resolved,
        pagination: {
          total,
          page,
          limit,
        },
      };
    } catch (error) {
      this.handleError("findAll", error);
    }
  }
  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      ...user,
      avatarUrl: this.storageService.resolveAvatarUrl(user.avatarUrl) ?? undefined,
    } as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email },
      select: [
        "id",
        "email",
        "passwordHash",
        "role",
        "isActive",
        "firstName",
        "lastName",
      ],
    });
  }
  async search(
    query: string,
    filters: { department?: string; subsidiary?: string; role?: string },
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      // Delegate the complex Elasticsearch logic to the dedicated search service
      const result = await this.usersSearch.unifiedSearch(
        query,
        "users",
        null,
        page,
        limit,
        filters,
      );

      return {
        data: result.results,
        total: result.total,
        page,
        limit,
        lastPage: Math.ceil(parseInt(result.total.toString()) / limit),
      };
    } catch (error) {
      this.handleError("search", error);
    }
  }

  async create(dto: CreateUserDto) {
    const [department, subsidiary] = await Promise.all([
      this.departRepo.findOneBy({ name: dto.department }),
      this.subsidiaryRepo.findOneBy({ name: dto.subsidiary }),
    ]);

    if (!department || !subsidiary) {
      throw new NotFoundException("Department or Subsidiary not found");
    }

    const emailDomain = dto.email.split("@")[1];
    if (subsidiary.domain && emailDomain !== subsidiary.domain) {
      throw new BadRequestException(
        `Email must use domain: ${subsidiary.domain}`,
      );
    }

    try {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(dto.password, salt);

      const newUser = this.userRepo.create({
        ...dto,
        passwordHash: passwordHash,
        role: dto.role as UserRole,
        subsidiary: subsidiary,
        department: department,
      });
      const saved = await this.userRepo.save(newUser);

      // We fetch a fresh copy of the user that includes the full
      // Department and Subsidiary objects (so we have the .name property)
      const userWithNames = await this.userRepo.findOne({
        where: { id: saved.id },
        relations: ["department", "subsidiary"],
      });

      if (userWithNames) {
        await this.jobsService.enqueueUserIndex({ userId: userWithNames.id });
      }

      return saved;
    } catch (error) {
      this.handleError("create", error);
    }
  }
  async update(
    id: string,
    dto: UpdateUserDto,
    requesterId: string,
    requesterRole: string,
  ) {
    if (
      requesterId !== id &&
      requesterRole !== "group_admin" &&
      requesterRole !== "subsidiary_admin"
    ) {
      throw new ForbiddenException("You can only update your own profile");
    }
    try {
      const existingUser = await this.findById(id);
      const updatedUser = await this.userRepo.save({
        ...existingUser,
        ...dto,
        role: dto.role as UserRole,
        subsidiary: dto.subsidiary ? { id: dto.subsidiary } : undefined,
        department: dto.department ? { id: dto.department } : undefined,
      });
      await this.jobsService.enqueueUserIndex({ userId: updatedUser.id });
      return updatedUser;
    } catch (error) {
      this.handleError("update", error);
    }
  }

  async updateProfilePic(
    userId: string,
    data: { avatarUrl: string },
  ) {
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });

      if (!user) throw new NotFoundException("User not found");

      user.avatarUrl = data.avatarUrl;

      const updatedUser = await this.userRepo.save(user);
      await this.jobsService.enqueueUserIndex({ userId: updatedUser.id });

      return {
        data: {
          avatarUrl: updatedUser.avatarUrl,
        },
      };
    } catch (error) {
      this.handleError("updateProfilePic", error);
    }
  }

  async deactivate(id: string): Promise<void> {
    try {
      const user = await this.findById(id);

      if (!user) throw new NotFoundException("User not found");
      user.isActive = false;

      const updatedUser = await this.userRepo.save(user);
      await Promise.all([
        this.jobsService.enqueueUserDelete({ userId: id }),
        this.jobsService.enqueueUserIndex({ userId: updatedUser.id }),
      ]);

      this.logger.log(
        `User ${user.firstName} ${user.lastName} deactivated successfully`,
      );
    } catch (error) {
      this.handleError("deactivate", error);
    }
  }
}
