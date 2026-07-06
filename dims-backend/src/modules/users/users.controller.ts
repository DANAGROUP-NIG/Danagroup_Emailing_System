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
  UseInterceptors,
  BadRequestException,
  UploadedFile,
  Put,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "@common/guards/jwt-auth.guard";
import { RolesGuard } from "@common/guards/roles.guards";
import { Roles } from "@common/decorators/roles.decorator";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateSignatureDto } from "./dto/update-signature.dto";
import { QueryUserDto } from "./dto/query-user.dto";
import { SearchService } from "@modules/search/search.service";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { StorageService } from "@modules/storage/storage.service";
import { FileInterceptor } from "@nestjs/platform-express/multer/interceptors/file.interceptor";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly searchService: SearchService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List all users (paginated)" })
  async findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get("search")
  @ApiOperation({ summary: "Search users by name or email (Elasticsearch-backed)" })
  async search(@Query() queryDto: QueryUserDto) {
    this.logger.log(`Search query received: ${JSON.stringify(queryDto)}`);
    return await this.searchService.searchUsers(
      queryDto.search || "",
      queryDto.page ?? 1,
      queryDto.limit ?? 10,
      {
        department: queryDto.department,
        subsidiary: queryDto.subsidiary,
        role: queryDto.role,
      },
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get user by ID" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Put("change-dp")
  @UseInterceptors(FileInterceptor("file"))
  async changeDisplayPicture(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() currentUser: { userId: string; role: string },
  ) {
    if (!file) {
      throw new BadRequestException("New profile image file is required");
    }

    const userId = currentUser.userId;

    // Fetch current user to delete old avatar from MinIO if it exists
    const user = await this.usersService.findById(userId);
    if (user?.avatarUrl && this.storageService.isStorageKey(user.avatarUrl)) {
      try {
        await this.storageService.delete(user.avatarUrl);
      } catch (err) {
        this.logger.warn(`Failed to delete old avatar for user ${userId}: ${(err as Error).message}`);
      }
    }

    // Upload new avatar to MinIO under avatars/<userId>/
    const result = await this.storageService.uploadAvatar(file, userId);
    const avatarUrl = this.storageService.getPublicUrl(result.storageKey);

    await this.usersService.updateProfilePic(userId, {
      avatarUrl: result.storageKey,
    });

    return {
      message: "Profile picture updated successfully",
      avatarUrl,
    };
  }

  @Post()
  @Roles("group_admin")
  @ApiOperation({ summary: "Create a new user (admin only)" })
  async create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update user profile" })
  async update(
    @Param("id") id: string,
    @Body() body: UpdateUserDto,
    @CurrentUser() currentUser: { userId: string; role: string },
  ) {
    return this.usersService.update(
      id,
      body,
      currentUser.userId,
      currentUser.role,
    );
  }

  @Get("me/signature")
  @ApiOperation({ summary: "Get the current user's email signature" })
  async getSignature(@CurrentUser() user: { userId: string }) {
    return this.usersService.getSignature(user.userId);
  }

  @Patch("me/signature")
  @ApiOperation({ summary: "Update the current user's email signature" })
  async updateSignature(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateSignatureDto,
  ) {
    return this.usersService.updateSignature(
      user.userId,
      dto.signature ?? null,
    );
  }

  @Delete(":id")
  @Roles("subsidiary_admin", "group_admin")
  @ApiOperation({ summary: "Deactivate a user (admin only)" })
  async deactivate(@Param("id") id: string) {
    return this.usersService.deactivate(id);
  }
}
