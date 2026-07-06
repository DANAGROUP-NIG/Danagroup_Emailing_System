import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";
import type { ChannelType } from "../entities/channel.entity";

export class CreateChannelDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(["public", "private"])
  type?: ChannelType;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  memberIds?: string[];
}
