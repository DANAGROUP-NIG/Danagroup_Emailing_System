import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { TwoFactorService } from "./two-factor.service";

class TotpTokenDto {
  @IsString()
  @Length(6, 8)
  token: string;
}

@ApiTags("2fa")
@ApiBearerAuth()
@Controller("2fa")
export class TwoFactorController {
  constructor(private readonly tfService: TwoFactorService) {}

  @Get("setup")
  @ApiOperation({
    summary: "Generate TOTP secret and QR code for 2FA enrollment",
  })
  setup(@CurrentUser() user: { userId: string }) {
    return this.tfService.generateSetup(user.userId);
  }

  @Post("confirm")
  @HttpCode(200)
  @ApiOperation({ summary: "Confirm a TOTP code to activate 2FA" })
  confirm(
    @Body() dto: TotpTokenDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.tfService.confirmEnable(user.userId, dto.token);
  }

  @Post("disable")
  @HttpCode(200)
  @ApiOperation({
    summary: "Disable 2FA after confirming with a valid TOTP code",
  })
  disable(
    @Body() dto: TotpTokenDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.tfService.disable(user.userId, dto.token);
  }

  @Get("status")
  @ApiOperation({ summary: "Get current 2FA enrollment status" })
  status(@CurrentUser() user: { userId: string }) {
    return this.tfService.getStatus(user.userId);
  }
}
