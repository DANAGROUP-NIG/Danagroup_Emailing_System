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
  ParseUUIDPipe,
  Logger,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "@common/guards/jwt-auth.guard";
import { RolesGuard } from "@common/guards/roles.guards";
import { Roles } from "@common/decorators/roles.decorator";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { QueryUserDto } from "./dto/query-user.dto";
import { SearchService } from "@modules/search/search.service";
import { CurrentUser } from "@common/decorators/current-user.decorator";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly searchService: SearchService,
  ) {}

  // TODO: Implement GET /users — list all active users (paginated)
  // Query: page, limit, subsidiaryId, departmentId, role
  // Protected: JWT guard
  @Get()
  @ApiOperation({ summary: "List all users (paginated)" })
  async findAll(@Query() query: any) {
    // TODO: Implement
    return this.usersService.findAll(query);
  }

  // TODO: Implement GET /users/search — search users by name/email
  // Query: q (string), limit (default 10)
  @Get("search")
  @ApiOperation({ summary: "Search users by name or email" })
  async search(@Query() queryDto: QueryUserDto) {
    // TODO: Implement

    this.logger.log(`Search query received: ${JSON.stringify(queryDto)}`);
    return await this.searchService.searchUsers(
      queryDto.search || "",
      queryDto.limit,
      {
        department: queryDto.department,
        subsidiary: queryDto.subsidiary,
        role: queryDto.role,
      },
    );
  }

  // TODO: Implement GET /users/:id — get user by ID
  @Get(":id")
  @ApiOperation({ summary: "Get user by ID" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    // TODO: Implement
    return this.usersService.findById(id);
  }

  // TODO: Implement POST /users — create new user (admin only)
  @Post()
  @Roles("group_admin")
  @ApiOperation({ summary: "Create a new user (admin only)" })
  async create(@Body() body: CreateUserDto) {
    // TODO: Implement
    return this.usersService.create(body);
  }

  // TODO: Implement PATCH /users/:id — update user (admin or self)
  @Patch(":id")
  @ApiOperation({ summary: "Update user profile" })
  async update(
    @Param("id") id: string,
    @Body() body: UpdateUserDto,
    @CurrentUser() currentUser: { userId: string; role: string },
  ) {
    // TODO: Implement
    return this.usersService.update(
      id,
      body,
      currentUser.userId,
      currentUser.role,
    );
  }

  // TODO: Implement DELETE /users/:id — deactivate user (admin only)
  @Delete(":id")
  @Roles("subsidiary_admin", "group_admin")
  @ApiOperation({ summary: "Deactivate a user (admin only)" })
  async deactivate(@Param("id") id: string) {
    // TODO: Implement
    return this.usersService.deactivate(id);
  }
}
