import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  IsEmail,
  IsBoolean,
} from "class-validator";

const normalizeOptionalEmailList = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const values = Array.isArray(value) ? value : String(value).split(",");
  return values
    .map((item) => String(item).trim().toLowerCase())
    .filter(Boolean);
};

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
  @Transform(normalizeOptionalEmailList)
  toEmails?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsEmail({}, { each: true })
  @ArrayUnique()
  @IsOptional()
  @Transform(normalizeOptionalEmailList)
  ccEmails?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsEmail({}, { each: true })
  @ArrayUnique()
  @IsOptional()
  @Transform(normalizeOptionalEmailList)
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

  @ApiPropertyOptional({ description: "Ignored compatibility flag" })
  @IsBoolean()
  @IsOptional()
  isDraft?: boolean;
}
