import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString() firstName: string;
  @IsString() lastName: string;
  @IsEmail() email: string;
  @IsString() @IsOptional() password?: string;

  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsString() subsidiary?: string;
  @IsOptional() @IsString() avatarUrl?: string;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() jobTitle?: string;

}
