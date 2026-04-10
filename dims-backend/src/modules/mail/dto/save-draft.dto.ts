import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";

export class SaveDraftDto {
  @ApiPropertyOptional({ description: "Existing thread ID for replies" })
  @IsUUID()
  @IsOptional()
  threadId?: string;

  @ApiPropertyOptional({ description: "Existing draft ID to update" })
  @IsUUID()
  @IsOptional()
  draftId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsUUID("all", { each: true })
  @ArrayUnique()
  @IsOptional()
  toIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsUUID("all", { each: true })
  @ArrayUnique()
  @IsOptional()
  ccIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsUUID("all", { each: true })
  @ArrayUnique()
  @IsOptional()
  bccIds?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  body?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bodyHtml?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsUUID("all", { each: true })
  @ArrayUnique()
  @IsOptional()
  attachmentIds?: string[];
}
