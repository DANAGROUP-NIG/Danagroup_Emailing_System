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
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
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

  @Delete("subsidiaries/:id")
  @Roles("group_admin")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete subsidiary (group_admin only)" })
  @ApiResponse({ status: 204, description: "Subsidiary deleted" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Subsidiary not found" })
  @ApiResponse({
    status: 409,
    description: "Subsidiary has departments or users",
  })
  async deleteSubsidiary(@Param("id") id: string) {
    return this.departmentsService.deleteSubsidiary(id);
  }

  @Post("subsidiaries/:id/logo")
  @Roles("group_admin")
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Upload subsidiary logo (group_admin only)" })
  @ApiResponse({ status: 200, description: "Logo uploaded" })
  async uploadSubsidiaryLogo(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.departmentsService.uploadSubsidiaryBranding(id, "logo", file);
  }

  @Post("subsidiaries/:id/favicon")
  @Roles("group_admin")
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Upload subsidiary favicon (group_admin only)" })
  @ApiResponse({ status: 200, description: "Favicon uploaded" })
  async uploadSubsidiaryFavicon(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.departmentsService.uploadSubsidiaryBranding(
      id,
      "favicon",
      file,
    );
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
