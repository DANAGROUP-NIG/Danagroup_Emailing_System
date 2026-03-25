import {
  IsString,
  IsArray,
  IsUUID,
  IsOptional,
  IsNotEmpty,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SendMailDto {
  @ApiPropertyOptional({ description: "Thread ID for reply/forward" })
  @IsUUID()
  @IsOptional()
  threadId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  draftId?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID("all", { each: true })
  toIds: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsUUID("all", { each: true })
  @IsOptional()
  ccIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsUUID("all", { each: true })
  @IsOptional()
  bccIds?: string[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bodyHtml?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsUUID("all", { each: true })
  @IsOptional()
  attachmentIds?: string[];
}
