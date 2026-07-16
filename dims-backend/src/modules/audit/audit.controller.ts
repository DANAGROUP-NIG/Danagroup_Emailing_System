import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsIn, IsInt, IsOptional, IsUUID } from "class-validator";
import { Roles } from "@common/decorators/roles.decorator";
import { AuditService } from "./audit.service";

class AuditQueryDto {
  @IsOptional()
  @IsUUID("4")
  actorId?: string;

  @IsOptional()
  action?: string;

  @IsOptional()
  @IsIn([
    "auth",
    "users",
    "mail",
    "distribution-lists",
    "announcements",
    "files",
    "channels",
    "chat",
    "2fa",
  ])
  resource?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
}

@ApiTags("audit")
@ApiBearerAuth()
@Controller("audit")
@Roles("group_admin", "subsidiary_admin")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: "Query audit logs (admin only)" })
  query(@Query() dto: AuditQueryDto) {
    return this.auditService.query(dto);
  }
}
