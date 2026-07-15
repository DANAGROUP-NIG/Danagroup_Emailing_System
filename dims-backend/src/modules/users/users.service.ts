import {
  BadRequestException,
  ConflictException,
  forwardRef,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository, ILike } from "typeorm";
import { User, UserRole } from "./entities/user.entity";
import { QueryUserDto } from "./dto/query-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { JobsService } from "@jobs/jobs.service";
import { UsersSearchService } from "./users-search.service";
import { Department } from "@modules/departments/entities/department.entity";
import { Subsidiary } from "@modules/departments/entities/subsidiary.entity";
import * as bcrypt from "bcrypt";
import DOMPurify from "isomorphic-dompurify";
import { MailService } from "@modules/mail/mail.service";
import { StorageService } from "@modules/storage/storage.service";

export interface CreateEmployeeUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  departmentId: string;
  jobTitle?: string;
}

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

  private handleError(
    method: string,
    error: Error & { stack?: string },
  ): never {
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

      const allowedSortColumns = [
        "firstName",
        "lastName",
        "createdAt",
      ] as const;
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
        avatarUrl:
          this.storageService.resolveAvatarUrl(u.avatarUrl) ?? undefined,
      }));

      return {
        data: resolved,
        pagination: {
          total,
          page,
          limit,
        },
      };
    } catch (error: any) {
      this.handleError("findAll", error);
    }
  }
  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ["subsidiary"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      ...user,
      avatarUrl:
        this.storageService.resolveAvatarUrl(user.avatarUrl) ?? undefined,
    } as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();

    return this.userRepo.findOne({
      where: { email: ILike(normalizedEmail) },
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

  async createEmployee(dto: CreateEmployeeUserInput): Promise<User> {
    const email = dto.email.trim().toLowerCase();
    const emailDomain = email.split("@")[1]?.toLowerCase();

    if (!emailDomain) {
      throw new BadRequestException("A valid company email is required");
    }

    const existingUser = await this.userRepo.findOne({
      where: { email: ILike(email) },
      select: ["id"],
    });

    if (existingUser) {
      throw new ConflictException("Email is already registered");
    }

    const subsidiary = await this.subsidiaryRepo.findOneBy({
      domain: ILike(emailDomain),
    });

    if (!subsidiary) {
      throw new BadRequestException(
        "Email domain is not registered to a subsidiary",
      );
    }

    const department = await this.departRepo.findOne({
      where: {
        id: dto.departmentId,
        subsidiaryId: subsidiary.id,
      },
    });

    if (!department) {
      throw new BadRequestException(
        "Department does not belong to the subsidiary matched by this email domain",
      );
    }

    try {
      const passwordHash = await bcrypt.hash(dto.password, 12);
      const employee = this.userRepo.create({
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email,
        passwordHash,
        role: "employee",
        jobTitle: dto.jobTitle?.trim() || undefined,
        subsidiary,
        subsidiaryId: subsidiary.id,
        department,
        departmentId: department.id,
        isActive: true,
        sessions: [],
      });

      const saved = await this.userRepo.save(employee);
      await this.jobsService.enqueueUserIndex({ userId: saved.id });

      const { passwordHash: _, ...safeUser } = saved;
      return safeUser as User;
    } catch (error: any) {
      if ((error as { code?: string }).code === "23505") {
        throw new ConflictException("Email is already registered");
      }

      this.handleError("createEmployee", error);
    }
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
    } catch (error: any) {
      this.handleError("search", error);
    }
  }

  async create(dto: CreateUserDto) {
    const [department, subsidiary] = await Promise.all([
      dto.departmentId ? this.departRepo.findOneBy({ id: dto.departmentId }) : undefined,
      dto.subsidiaryId ? this.subsidiaryRepo.findOneBy({ id: dto.subsidiaryId }) : undefined,
    ]);

    if (dto.departmentId && !department) {
      throw new NotFoundException("Department not found");
    }
    if (dto.subsidiaryId && !subsidiary) {
      throw new NotFoundException("Subsidiary not found");
    }

    const emailDomain = dto.email.split("@")[1];
    if (subsidiary?.domain && emailDomain !== subsidiary.domain) {
      throw new BadRequestException(
        `Email must use domain: ${subsidiary.domain}`,
      );
    }

    const rawPassword = dto.password?.trim() || this.generateRandomPassword();

    try {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(rawPassword, salt);

      const newUser = this.userRepo.create({
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email: dto.email.toLowerCase().trim(),
        jobTitle: dto.jobTitle?.trim(),
        role: (dto.role as UserRole) ?? "employee",
        avatarUrl: dto.avatarUrl,
        passwordHash,
        subsidiary: subsidiary ?? undefined,
        department: department ?? undefined,
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
    } catch (error: any) {
      this.handleError("create", error);
    }
  }

  private generateRandomPassword(length = 16): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
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
        subsidiary: dto.subsidiaryId ? { id: dto.subsidiaryId } : undefined,
        department: dto.departmentId ? { id: dto.departmentId } : undefined,
      });
      await this.jobsService.enqueueUserIndex({ userId: updatedUser.id });
      return updatedUser;
    } catch (error: any) {
      this.handleError("update", error);
    }
  }

  async updateProfilePic(userId: string, data: { avatarUrl: string }) {
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
    } catch (error: any) {
      this.handleError("updateProfilePic", error);
    }
  }

  async getSignature(userId: string): Promise<{ signature: string | null }> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ["id", "signature"],
    });
    if (!user) throw new NotFoundException("User not found");
    return { signature: user.signature ?? null };
  }

  async updateSignature(
    userId: string,
    signature: string | null,
  ): Promise<{ signature: string | null }> {
    const sanitized = signature
      ? DOMPurify.sanitize(signature, {
          ALLOWED_TAGS: [
            "p",
            "br",
            "b",
            "i",
            "strong",
            "em",
            "u",
            "a",
            "span",
            "div",
            "hr",
            "img",
          ],
          ALLOWED_ATTR: ["href", "target", "style", "class", "src", "alt", "title", "width", "height"],
        })
      : null;

    await this.userRepo.update(userId, { signature: sanitized ?? undefined });
    return { signature: sanitized };
  }

  async getSignatureForSend(userId: string): Promise<string | null> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ["id", "signature"],
    });
    return user?.signature ?? null;
  }

  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.userRepo
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.id = :id", { id })
      .getOne();
  }

  async updatePasswordHash(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    await this.userRepo
      .createQueryBuilder()
      .update()
      .set({ passwordHash })
      .where("id = :userId", { userId })
      .execute();
  }

  async deliverPasswordResetNotification(
    userId: string,
    resetLink: string,
    expiryMinutes: number,
  ): Promise<void> {
    await this.jobsService.enqueueNotification({
      userId,
      type: "system",
      title: "Password reset requested",
      body: `A password reset was requested for your account. Use the link below to set a new password (valid for ${expiryMinutes} minutes):\n\n${resetLink}\n\nIf you did not request this, you can ignore this notification.`,
    });
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
    } catch (error: any) {
      this.handleError("deactivate", error);
    }
  }
}
