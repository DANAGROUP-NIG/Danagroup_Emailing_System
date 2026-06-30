import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Department } from "./entities/department.entity";
import { Subsidiary } from "./entities/subsidiary.entity";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";
import { CreateSubsidiaryDto } from "./dto/create-subsidiary.dto";
import { UpdateSubsidiaryDto } from "./dto/update-subsidiary.dto";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";

const CACHE_TTL_LIST = 10 * 60 * 1000; // 10 minutes
const CACHE_TTL_ITEM = 5 * 60 * 1000;  // 5 minutes

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
    @InjectRepository(Subsidiary)
    private readonly subsidiaryRepo: Repository<Subsidiary>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  async findAllDepartments(subsidiaryId?: string) {
    const key = subsidiaryId
      ? `departments:by-subsidiary:${subsidiaryId}`
      : `departments:all`;
    const cached = await this.cache.get<Department[]>(key);
    if (cached) return cached;

    const data = await this.deptRepo.find({
      where: subsidiaryId ? { subsidiaryId } : undefined,
      relations: ["subsidiary"],
    });
    await this.cache.set(key, data, CACHE_TTL_LIST);
    return data;
  }

  async findDepartmentById(id: string) {
    const key = `department:${id}`;
    const cached = await this.cache.get<Department>(key);
    if (cached) return cached;

    const department = await this.deptRepo.findOne({
      where: { id },
      relations: ["subsidiary"],
    });
    if (!department) {
      throw new NotFoundException("Department not found");
    }
    await this.cache.set(key, department, CACHE_TTL_ITEM);
    return department;
  }

  async createDepartment(dto: CreateDepartmentDto) {
    const subsidiary = await this.subsidiaryRepo.findOne({
      where: { id: dto.subsidiaryId },
    });
    if (!subsidiary) {
      throw new NotFoundException("Subsidiary not found");
    }

    try {
      const department = this.deptRepo.create(dto);
      const saved = await this.deptRepo.save(department);
      await this.invalidateDepartmentCaches(dto.subsidiaryId);
      return saved;
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === "23505") {
        throw new ConflictException(
          "A department with this name already exists in the subsidiary",
        );
      }
      throw error;
    }
  }

  async updateDepartment(id: string, dto: UpdateDepartmentDto) {
    const department = await this.findDepartmentById(id);
    Object.assign(department, dto);
    const saved = await this.deptRepo.save(department);
    await this.invalidateDepartmentCaches(department.subsidiaryId, id);
    return saved;
  }

  async deleteDepartment(id: string) {
    const department = await this.deptRepo.findOne({
      where: { id },
      relations: ["users"],
    });
    if (!department) {
      throw new NotFoundException("Department not found");
    }

    const activeUsers = department.users?.filter((u) => u.isActive) ?? [];
    if (activeUsers.length > 0) {
      throw new ConflictException("Cannot delete department with active users");
    }

    await this.deptRepo.remove(department);
    await this.invalidateDepartmentCaches(department.subsidiaryId, id);
  }

  private async invalidateDepartmentCaches(
    subsidiaryId?: string,
    departmentId?: string,
  ) {
    const keys: Promise<void>[] = [
      this.cache.del(`departments:all`),
    ];
    if (subsidiaryId) {
      keys.push(this.cache.del(`departments:by-subsidiary:${subsidiaryId}`));
    }
    if (departmentId) {
      keys.push(this.cache.del(`department:${departmentId}`));
    }
    await Promise.all(keys);
  }

  async findAllSubsidiaries() {
    const key = `subsidiaries:all`;
    const cached = await this.cache.get<Subsidiary[]>(key);
    if (cached) return cached;

    const data = await this.subsidiaryRepo.find({ relations: ["departments"] });
    await this.cache.set(key, data, CACHE_TTL_LIST);
    return data;
  }

  async findSubsidiaryById(id: string) {
    const key = `subsidiary:${id}`;
    const cached = await this.cache.get<Subsidiary>(key);
    if (cached) return cached;

    const subsidiary = await this.subsidiaryRepo.findOne({
      where: { id },
      relations: ["departments"],
    });
    if (!subsidiary) {
      throw new NotFoundException("Subsidiary not found");
    }
    await this.cache.set(key, subsidiary, CACHE_TTL_ITEM);
    return subsidiary;
  }

  async createSubsidiary(dto: CreateSubsidiaryDto) {
    try {
      const subsidiary = this.subsidiaryRepo.create(dto);
      const saved = await this.subsidiaryRepo.save(subsidiary);
      await this.invalidateSubsidiaryCaches();
      return saved;
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === "23505") {
        throw new ConflictException(
          "A subsidiary with this name or domain already exists",
        );
      }
      throw error;
    }
  }

  async updateSubsidiary(id: string, dto: UpdateSubsidiaryDto) {
    const subsidiary = await this.findSubsidiaryById(id);
    Object.assign(subsidiary, dto);
    const saved = await this.subsidiaryRepo.save(subsidiary);
    await this.invalidateSubsidiaryCaches(id);
    return saved;
  }

  private async invalidateSubsidiaryCaches(subsidiaryId?: string) {
    const keys: Promise<void>[] = [this.cache.del(`subsidiaries:all`)];
    if (subsidiaryId) {
      keys.push(this.cache.del(`subsidiary:${subsidiaryId}`));
      keys.push(this.cache.del(`departments:by-subsidiary:${subsidiaryId}`));
    }
    await Promise.all(keys);
  }
}
