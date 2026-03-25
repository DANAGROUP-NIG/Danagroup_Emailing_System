import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // TODO: Implement GET /users — list all active users (paginated)
  // Query: page, limit, subsidiaryId, departmentId, role
  // Protected: JWT guard
  @Get()
  @ApiOperation({ summary: "List all users (paginated)" })
  async findAll(@Query() query: any) {
    // TODO: Implement
  }

  // TODO: Implement GET /users/search — search users by name/email
  // Query: q (string), limit (default 10)
  @Get("search")
  @ApiOperation({ summary: "Search users by name or email" })
  async search(@Query("q") q: string) {
    // TODO: Implement
  }

  // TODO: Implement GET /users/:id — get user by ID
  @Get(":id")
  @ApiOperation({ summary: "Get user by ID" })
  async findOne(@Param("id") id: string) {
    // TODO: Implement
  }

  // TODO: Implement POST /users — create new user (admin only)
  @Post()
  @ApiOperation({ summary: "Create a new user (admin only)" })
  async create(@Body() body: any) {
    // TODO: Implement
  }

  // TODO: Implement PATCH /users/:id — update user (admin or self)
  @Patch(":id")
  @ApiOperation({ summary: "Update user profile" })
  async update(@Param("id") id: string, @Body() body: any) {
    // TODO: Implement
  }

  // TODO: Implement DELETE /users/:id — deactivate user (admin only)
  @Delete(":id")
  @ApiOperation({ summary: "Deactivate a user (admin only)" })
  async deactivate(@Param("id") id: string) {
    // TODO: Implement
  }
}
