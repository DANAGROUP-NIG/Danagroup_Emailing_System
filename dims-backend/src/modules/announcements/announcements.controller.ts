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
import { AnnouncementsService } from "./announcements.service";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { Roles } from "@common/decorators/roles.decorator";
import { CreateAnnouncementDto } from "./dto/create-announcement.dto";
import { UpdateAnnouncementDto } from "./dto/update-announcement.dto";
import { QueryAnnouncementsDto } from "./dto/query-announcements.dto";

@ApiTags("announcements")
@ApiBearerAuth()
@Controller("announcements")
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  @ApiOperation({ summary: "List announcements (paginated, filterable)" })
  @ApiResponse({ status: 200, description: "Announcements returned" })
  async findAll(@Query() query: QueryAnnouncementsDto) {
    return this.announcementsService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get announcement by ID" })
  @ApiResponse({ status: 200, description: "Announcement returned" })
  @ApiResponse({ status: 404, description: "Announcement not found" })
  async findOne(@Param("id") id: string) {
    return this.announcementsService.findById(id);
  }

  @Post()
  @Roles("manager", "subsidiary_admin", "group_admin")
  @ApiOperation({ summary: "Create announcement (manager/admin only)" })
  @ApiResponse({ status: 201, description: "Announcement created" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async create(
    @Body() body: CreateAnnouncementDto,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.announcementsService.create(body, user.userId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update announcement (author or admin)" })
  @ApiResponse({ status: 200, description: "Announcement updated" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Announcement not found" })
  async update(
    @Param("id") id: string,
    @Body() body: UpdateAnnouncementDto,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.announcementsService.update(id, body, user.userId, user.role);
  }

  @Patch(":id/pin")
  @Roles("subsidiary_admin", "group_admin")
  @ApiOperation({ summary: "Toggle pin on announcement (admin only)" })
  @ApiResponse({ status: 200, description: "Pin state toggled" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Announcement not found" })
  async togglePin(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.announcementsService.togglePin(id, user.userId, user.role);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete announcement (author or admin)" })
  @ApiResponse({ status: 204, description: "Announcement deleted" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Announcement not found" })
  async remove(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.announcementsService.delete(id, user.userId, user.role);
  }
}
