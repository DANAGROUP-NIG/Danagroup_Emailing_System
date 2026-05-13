import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";
import { AnnouncementTarget } from "../entities/announcement.entity";

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  title: string;

  @IsString()
  @MinLength(1)
  body: string;

  @IsEnum(["all", "subsidiary", "department"])
  target: AnnouncementTarget;

  @ValidateIf((o) => o.target === "subsidiary")
  @IsUUID()
  subsidiaryId?: string;

  @ValidateIf((o) => o.target === "department")
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsDateString()
  publishedAt?: Date;
}
