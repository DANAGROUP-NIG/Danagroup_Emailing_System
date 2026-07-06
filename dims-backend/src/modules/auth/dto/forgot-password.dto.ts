import { Transform } from "class-transformer";
import { IsEmail, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ForgotPasswordDto {
  @ApiProperty({ example: "john.doe@danagroup.internal" })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(100)
  email: string;
}
