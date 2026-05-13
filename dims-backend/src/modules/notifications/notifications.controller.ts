import { Controller, Get, Param, Patch, Query } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { NotificationsService } from "./notifications.service";
import { QueryNotificationsDto } from "./dto/query-notifications.dto";

@ApiTags("notifications")
@ApiBearerAuth()
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: "List notifications for the current user (paginated)",
  })
  @ApiResponse({ status: 200, description: "Notifications returned" })
  async findAll(
    @CurrentUser() user: { userId: string },
    @Query() query: QueryNotificationsDto,
  ) {
    return this.notificationsService.findAllForUser(user.userId, query);
  }

  @Get("unread-count")
  @ApiOperation({
    summary: "Get unread notification count for the current user",
  })
  @ApiResponse({ status: 200, description: "Unread count returned" })
  async getUnreadCount(@CurrentUser() user: { userId: string }) {
    return this.notificationsService.getUnreadCount(user.userId);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark a notification as read" })
  @ApiResponse({ status: 200, description: "Notification marked as read" })
  @ApiResponse({ status: 404, description: "Notification not found" })
  async markRead(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.notificationsService.markRead(id, user.userId);
  }

  @Patch("read-all")
  @ApiOperation({
    summary: "Mark all notifications as read for the current user",
  })
  @ApiResponse({ status: 200, description: "All notifications marked as read" })
  async markAllRead(@CurrentUser() user: { userId: string }) {
    return this.notificationsService.markAllRead(user.userId);
  }
}
