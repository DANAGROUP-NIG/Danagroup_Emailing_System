import {
  IsString,
  IsArray,
  IsUUID,
  IsOptional,
  IsNotEmpty,
  IsEmail,
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

  @ApiProperty({ type: [String], example: ["user@example.com"] })
  @IsArray()
  @IsEmail({}, { each: true })
  toEmails: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  ccEmails?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  bccEmails?: string[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subject?: string;

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
