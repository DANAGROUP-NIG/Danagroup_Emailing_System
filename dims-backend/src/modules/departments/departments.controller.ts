import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { DepartmentsService } from "./departments.service";
import { Roles } from "@common/decorators/roles.decorator";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";
import { CreateSubsidiaryDto } from "./dto/create-subsidiary.dto";
import { UpdateSubsidiaryDto } from "./dto/update-subsidiary.dto";

@ApiTags("departments")
@ApiBearerAuth()
@Controller("departments")
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  // ── Subsidiaries routes MUST come before /:id to avoid route shadowing ──

  @Get("subsidiaries")
  @ApiOperation({ summary: "List all subsidiaries" })
  @ApiResponse({ status: 200, description: "Subsidiaries returned" })
  async findAllSubsidiaries() {
    return this.departmentsService.findAllSubsidiaries();
  }

  @Get("subsidiaries/:id")
  @ApiOperation({ summary: "Get subsidiary by ID" })
  @ApiResponse({ status: 200, description: "Subsidiary returned" })
  @ApiResponse({ status: 404, description: "Subsidiary not found" })
  async findSubsidiaryById(@Param("id") id: string) {
    return this.departmentsService.findSubsidiaryById(id);
  }

  @Post("subsidiaries")
  @Roles("group_admin")
  @ApiOperation({ summary: "Create subsidiary (group_admin only)" })
  @ApiResponse({ status: 201, description: "Subsidiary created" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 409, description: "Subsidiary already exists" })
  async createSubsidiary(@Body() body: CreateSubsidiaryDto) {
    return this.departmentsService.createSubsidiary(body);
  }

  @Patch("subsidiaries/:id")
  @Roles("group_admin")
  @ApiOperation({ summary: "Update subsidiary (group_admin only)" })
  @ApiResponse({ status: 200, description: "Subsidiary updated" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Subsidiary not found" })
  async updateSubsidiary(
    @Param("id") id: string,
    @Body() body: UpdateSubsidiaryDto,
  ) {
    return this.departmentsService.updateSubsidiary(id, body);
  }

  // ── Department routes ──

  @Get()
  @ApiOperation({
    summary: "List all departments (optionally filter by subsidiaryId)",
  })
  @ApiResponse({ status: 200, description: "Departments returned" })
  async findAll(@Query("subsidiaryId") subsidiaryId?: string) {
    return this.departmentsService.findAllDepartments(subsidiaryId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get department by ID" })
  @ApiResponse({ status: 200, description: "Department returned" })
  @ApiResponse({ status: 404, description: "Department not found" })
  async findOne(@Param("id") id: string) {
    return this.departmentsService.findDepartmentById(id);
  }

  @Post()
  @Roles("subsidiary_admin", "group_admin")
  @ApiOperation({
    summary: "Create department (subsidiary_admin/group_admin only)",
  })
  @ApiResponse({ status: 201, description: "Department created" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Subsidiary not found" })
  @ApiResponse({ status: 409, description: "Department already exists" })
  async create(@Body() body: CreateDepartmentDto) {
    return this.departmentsService.createDepartment(body);
  }

  @Patch(":id")
  @Roles("subsidiary_admin", "group_admin")
  @ApiOperation({
    summary: "Update department (subsidiary_admin/group_admin only)",
  })
  @ApiResponse({ status: 200, description: "Department updated" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Department not found" })
  async update(@Param("id") id: string, @Body() body: UpdateDepartmentDto) {
    return this.departmentsService.updateDepartment(id, body);
  }

  @Delete(":id")
  @Roles("group_admin")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete department (group_admin only)" })
  @ApiResponse({ status: 204, description: "Department deleted" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Department not found" })
  @ApiResponse({ status: 409, description: "Department has active users" })
  async remove(@Param("id") id: string) {
    return this.departmentsService.deleteDepartment(id);
  }
}
