import { Transform } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class SignupDto {
  @ApiProperty({ example: "John" })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: "Doe" })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: "john.doe@dana.danagroup.internal" })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(100)
  email: string;

  @ApiProperty({ example: "StrongP@ssw0rd" })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      "Password must include at least one uppercase letter, one lowercase letter, and one number",
  })
  password: string;

  @ApiProperty({
    example: "16d5c7f4-6d20-4b9e-89bd-3f95bdb571db",
  })
  @IsUUID()
  departmentId: string;

  @ApiPropertyOptional({ example: "Software Engineer" })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  jobTitle?: string;
}
