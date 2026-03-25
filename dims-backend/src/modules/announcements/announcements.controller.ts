import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AnnouncementsService } from "./announcements.service";

@ApiTags("announcements")
@ApiBearerAuth()
@Controller("announcements")
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  // TODO: GET /announcements — paginated; filter by target (all/subsidiary/department)
  @Get()
  @ApiOperation({ summary: "List announcements (paginated, filterable)" })
  async findAll(@Query() query: any) {}

  // TODO: GET /announcements/:id
  @Get(":id")
  @ApiOperation({ summary: "Get announcement by ID" })
  async findOne(@Param("id") id: string) {}

  // TODO: POST /announcements (manager, subsidiary_admin, group_admin only)
  @Post()
  @ApiOperation({ summary: "Create announcement" })
  async create(@Body() body: any) {}

  // TODO: PATCH /announcements/:id — edit own announcement (or admin)
  @Patch(":id")
  @ApiOperation({ summary: "Update announcement" })
  async update(@Param("id") id: string, @Body() body: any) {}

  // TODO: PATCH /announcements/:id/pin — pin/unpin (admin only)
  @Patch(":id/pin")
  @ApiOperation({ summary: "Toggle pin on announcement (admin only)" })
  async togglePin(@Param("id") id: string) {}

  // TODO: DELETE /announcements/:id
  @Delete(":id")
  @ApiOperation({ summary: "Delete announcement" })
  async remove(@Param("id") id: string) {}
}
