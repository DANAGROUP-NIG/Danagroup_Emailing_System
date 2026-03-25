import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Department } from "./entities/department.entity";
import { Subsidiary } from "./entities/subsidiary.entity";

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
    @InjectRepository(Subsidiary)
    private readonly subsidiaryRepo: Repository<Subsidiary>,
  ) {}

  // TODO: Implement findAllDepartments(): Department[]
  // TODO: Implement findDepartmentById(id): Department
  // TODO: Implement createDepartment(dto): Department (admin only)
  // TODO: Implement updateDepartment(id, dto): Department (admin only)
  // TODO: Implement deleteDepartment(id): void (admin only)
  // TODO: Implement findAllSubsidiaries(): Subsidiary[]
  // TODO: Implement createSubsidiary(dto): Subsidiary (group_admin only)
}
