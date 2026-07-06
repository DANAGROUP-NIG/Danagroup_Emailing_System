import { IsInt, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

export class QueryChatDto {
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
  @IsString()
  before?: string;
}
