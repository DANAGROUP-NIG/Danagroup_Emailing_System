import { IsString, MaxLength, MinLength, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ChangePasswordDto {
  @ApiProperty({ example: "CurrentP@ss1" })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: "NewP@ssw0rd" })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      "Password must include at least one uppercase letter, one lowercase letter, and one number",
  })
  newPassword: string;
}
