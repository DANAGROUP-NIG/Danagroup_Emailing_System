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
import { ILike, Repository } from "typeorm";
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
      const where = [];
      if (search) {
        where.push([
          { firstName: ILike(`%${search}%`) },
          { lastName: ILike(`%${search}%`) },
          { email: ILike(`%${search}%`) },
        ]);
      }
      if (department) where.push({ department });
      if (subsidiary) where.push({ subsidiary });
      if (role) where.push({ role });

      const [data, total] = await this.userRepo.findAndCount({
        where: where.length ? where : undefined,
        take: limit,
        skip: (page - 1) * limit,
        order: { [sortBy || "firstName"]: "ASC" },
      });
      return {
        data,
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
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
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
    // Find the existing department and subsidiary by name
    const department = await this.departRepo.findOneBy({
      name: dto.department,
    });
    const subsidiary = await this.subsidiaryRepo.findOneBy({
      name: dto.subsidiary,
    });

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
    } catch (error: any) {
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
    } catch (error: any) {
      this.handleError("update", error);
    }
  }

  async updateProfilePic(
    userId: string,
    data: { avatarUrl: string; avatarPublicId: string },
  ) {
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });

      if (!user) throw new NotFoundException("User not found");

      user.avatarUrl = data.avatarUrl;
      user.avatarPublicId = data.avatarPublicId;

      const updatedUser = await this.userRepo.save(user);
      await this.jobsService.enqueueUserIndex({ userId: updatedUser.id });

      return {
        data: {
          avatarUrl: updatedUser.avatarUrl,
          avatarPublicId: updatedUser.avatarPublicId,
        },
      };
    } catch (error: any) {
      this.handleError("updateProfilePic", error);
    }
  }

  async deactivate(id: string): Promise<void> {
    try {
      const user = await this.findById(id);

      if (!user) throw new NotFoundException("User not found");
      user.isActive = false;

      const updatedUser = await this.userRepo.save(user);
      await this.jobsService.enqueueUserDelete({ userId: id });

      await this.jobsService.enqueueUserIndex({ userId: updatedUser.id });

      this.logger.log(
        `User ${user.firstName} ${user.lastName} deactivated successfully`,
      );
    } catch (error: any) {
      this.handleError("deactivate", error);
    }
  }
}
