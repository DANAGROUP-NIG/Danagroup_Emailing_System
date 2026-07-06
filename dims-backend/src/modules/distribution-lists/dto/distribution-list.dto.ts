import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreateDistributionListDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsEmail()
  @MaxLength(320)
  email: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsUUID("4", { each: true })
  memberIds?: string[];
}

export class UpdateDistributionListDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class AddMembersDto {
  @IsUUID("4", { each: true })
  userIds: string[];
}
