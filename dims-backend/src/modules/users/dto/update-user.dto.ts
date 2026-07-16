import { PartialType } from "@nestjs/mapped-types";
import { ApiHideProperty } from "@nestjs/swagger";
import { CreateUserDto } from "./create-user.dto";
import { IsOptional } from "class-validator";

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiHideProperty()
  sessions?: { refreshToken: string; userAgent: string; ip: string }[];
  @IsOptional() isActive?: boolean;
  @IsOptional() signatureBeforeQuote?: boolean;
}
