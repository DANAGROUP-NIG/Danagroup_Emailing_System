import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from "class-validator";
import { Transform } from "class-transformer";
import { AnnouncementTarget } from "../entities/announcement.entity";

export class QueryAnnouncementsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsEnum(["all", "subsidiary", "department"])
  target?: AnnouncementTarget;

  @IsOptional()
  @IsUUID()
  subsidiaryId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  isPinned?: boolean;
}
