import {
  ConflictException,
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

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
    @InjectRepository(Subsidiary)
    private readonly subsidiaryRepo: Repository<Subsidiary>,
  ) {}

  async findAllDepartments(subsidiaryId?: string) {
    return this.deptRepo.find({
      where: subsidiaryId ? { subsidiaryId } : undefined,
      relations: ["subsidiary"],
    });
  }

  async findDepartmentById(id: string) {
    const department = await this.deptRepo.findOne({
      where: { id },
      relations: ["subsidiary"],
    });
    if (!department) {
      throw new NotFoundException("Department not found");
    }
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
      return await this.deptRepo.save(department);
    } catch (error: any) {
      if (error?.code === "23505") {
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
    return this.deptRepo.save(department);
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
  }

  async findAllSubsidiaries() {
    return this.subsidiaryRepo.find({ relations: ["departments"] });
  }

  async findSubsidiaryById(id: string) {
    const subsidiary = await this.subsidiaryRepo.findOne({
      where: { id },
      relations: ["departments"],
    });
    if (!subsidiary) {
      throw new NotFoundException("Subsidiary not found");
    }
    return subsidiary;
  }

  async createSubsidiary(dto: CreateSubsidiaryDto) {
    try {
      const subsidiary = this.subsidiaryRepo.create(dto);
      return await this.subsidiaryRepo.save(subsidiary);
    } catch (error: any) {
      if (error?.code === "23505") {
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
    return this.subsidiaryRepo.save(subsidiary);
  }
}
