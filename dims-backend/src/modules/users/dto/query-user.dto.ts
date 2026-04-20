import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class QueryUserDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsString() subsidiary?: string;
  @IsOptional() @IsString() role?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;

  @ApiPropertyOptional({
    type: String,
    enum: ["firstName", "department", "createdAt"],
    default: "firstName",
  })
  @IsOptional()
  @IsString()
  sortBy: "firstName" | "department" | "createdAt" = "firstName";
}
