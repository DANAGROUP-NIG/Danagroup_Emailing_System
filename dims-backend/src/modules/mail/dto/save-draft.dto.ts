import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  IsEmail,
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
  @IsEmail({}, { each: true })
  @ArrayUnique()
  @IsOptional()
  toEmails?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsEmail({}, { each: true })
  @ArrayUnique()
  @IsOptional()
  ccEmails?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsEmail({}, { each: true })
  @ArrayUnique()
  @IsOptional()
  bccEmails?: string[];

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
