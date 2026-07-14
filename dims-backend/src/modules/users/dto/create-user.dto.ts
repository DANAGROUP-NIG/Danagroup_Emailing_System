import { IsEmail, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateUserDto {
  @IsString() firstName: string;
  @IsString() lastName: string;
  @IsEmail() email: string;
  @IsString() @IsOptional() password?: string;

  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsUUID() subsidiaryId?: string;
  @IsOptional() @IsString() avatarUrl?: string;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() jobTitle?: string;
}
