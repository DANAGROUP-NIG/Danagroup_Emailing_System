import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { DepartmentsService } from "./departments.service";

@ApiTags("departments")
@ApiBearerAuth()
@Controller("departments")
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  // TODO: GET /departments — list all departments
  @Get()
  @ApiOperation({ summary: "List all departments" })
  async findAll() {}

  // TODO: GET /departments/:id
  @Get(":id")
  @ApiOperation({ summary: "Get department by ID" })
  async findOne(@Param("id") id: string) {}

  // TODO: POST /departments (admin only)
  @Post()
  @ApiOperation({ summary: "Create department (admin only)" })
  async create(@Body() body: any) {}

  // TODO: PATCH /departments/:id (admin only)
  @Patch(":id")
  @ApiOperation({ summary: "Update department (admin only)" })
  async update(@Param("id") id: string, @Body() body: any) {}

  // TODO: DELETE /departments/:id (admin only)
  @Delete(":id")
  @ApiOperation({ summary: "Delete department (admin only)" })
  async remove(@Param("id") id: string) {}
}
