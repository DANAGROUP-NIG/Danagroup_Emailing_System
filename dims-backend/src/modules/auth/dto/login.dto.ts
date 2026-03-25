import { IsEmail, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({ example: "john.doe@dana.danagroup.internal" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "StrongP@ssw0rd" })
  @IsString()
  @MinLength(8)
  password: string;
}
