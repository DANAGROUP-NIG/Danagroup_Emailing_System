import { ApiProperty } from "@nestjs/swagger";

export class AuthUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({
    enum: ["employee", "manager", "subsidiary_admin", "group_admin"],
  })
  role: string;

  @ApiProperty()
  jobTitle: string;

  @ApiProperty()
  avatarUrl: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  department_id: string;

  @ApiProperty()
  subsidiary_id: string;

  @ApiProperty({ required: false, nullable: true, type: String })
  lastLoginAt?: Date | null;

  @ApiProperty({ type: String })
  createdAt: Date;

  @ApiProperty({ type: String })
  updatedAt: Date;
}

export class LoginResponseDataDto {
  @ApiProperty({ type: () => AuthUserDto })
  user: AuthUserDto;

  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}

export class LoginResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "Login successful" })
  message: string;

  @ApiProperty({ type: () => LoginResponseDataDto })
  data: LoginResponseDataDto;
}

export class MessageResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "Logged out successfully" })
  message: string;
}

export class CurrentUserResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "User fetched" })
  message: string;

  @ApiProperty({ type: () => AuthUserDto })
  data: AuthUserDto;
}
