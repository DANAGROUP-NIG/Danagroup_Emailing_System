import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from "@nestjs/common";
import { Response, Request } from "express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { DepartmentsService } from "../departments/departments.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { SignupDto } from "./dto/signup.dto";
import { VerifyTotpDto } from "./dto/verify-totp.dto";
import { ApiResponseDto } from "@common/dto/api-response.dto";
import { AuthGuard } from "@nestjs/passport";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { Public } from "@common/decorators/public.decorator";
import { Roles } from "@common/decorators/roles.decorator";
import {
  CurrentUserResponseDto,
  LoginResponseDto,
  MessageResponseDto,
} from "./dto/auth-response.dto";
import { UserShape } from "./auth.service";
import { StorageService } from "@modules/storage/storage.service";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

type AuthenticatedRequest = Request & {
  user: UserShape;
};

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly departmentsService: DepartmentsService,
    private readonly storageService: StorageService,
  ) {}

  private setAuthCookies(
    res: Response,
    result: { accessToken: string; refreshToken: string },
  ) {
    res.cookie("access_token", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post("signup")
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: SignupDto })
  @ApiOperation({ summary: "Create an employee account" })
  @ApiCreatedResponse({
    description: "Employee account created",
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid signup details" })
  @ApiResponse({ status: 409, description: "Email is already registered" })
  async signup(
    @Body() signupDto: SignupDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const result = await this.authService.signup(
      signupDto,
      req.headers["user-agent"],
      req.ip,
      req,
    );

    if ("requires2FA" in result) {
      res.clearCookie("totp_challenge");
      throw new UnauthorizedException("Unexpected 2FA challenge during signup");
    }

    this.setAuthCookies(res, result);

    return new ApiResponseDto(true, "Signup successful", {
      user: result.user,
    });
  }

  @Public()
  @Get("signup-options")
  @ApiOperation({ summary: "Get domains and departments available for signup" })
  @ApiOkResponse({ description: "Signup options returned" })
  async signupOptions() {
    const subsidiaries = await this.departmentsService.findAllSubsidiaries();
    return new ApiResponseDto(true, "Signup options fetched", {
      subsidiaries,
    });
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(AuthGuard("local"))
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginDto })
  @ApiOperation({ summary: "Login with email and password" })
  @ApiOkResponse({
    description: "Login successful or 2FA challenge required",
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(
    @Body() _loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = req.user;

    const result = await this.authService.login(
      user,
      req.headers["user-agent"],
      req.ip,
      req,
    );

    // If 2FA is enabled, issue a short-lived challenge token and pause login.
    if ("requires2FA" in result) {
      res.cookie("totp_challenge", result.challengeToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 5 * 60 * 1000, // 5 minutes
      });
      return new ApiResponseDto(true, "Two-factor authentication required", {
        requires2FA: true,
        email: result.email,
      });
    }

    this.setAuthCookies(res, result);

    return new ApiResponseDto(true, "Login successful", {
      user: result.user,
    });
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("verify-totp")
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: VerifyTotpDto })
  @ApiOperation({ summary: "Verify TOTP code and complete login" })
  @ApiOkResponse({ description: "Login successful", type: LoginResponseDto })
  @ApiResponse({ status: 401, description: "Invalid or expired TOTP code" })
  async verifyTotp(
    @Body() dto: VerifyTotpDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const challengeToken = req.cookies?.totp_challenge;
    if (!challengeToken) {
      throw new UnauthorizedException(
        "Login session expired. Please sign in again.",
      );
    }

    const payload = this.authService.verifyTotpChallengeToken(challengeToken);
    if (!payload || payload.type !== "totp_challenge" || !payload.sub) {
      res.clearCookie("totp_challenge");
      throw new UnauthorizedException(
        "Invalid login session. Please sign in again.",
      );
    }

    const result = await this.authService.verifyTotpAndLogin(
      payload.sub,
      dto.token,
      req.headers["user-agent"],
      req.ip,
      req,
    );

    res.clearCookie("totp_challenge");
    this.setAuthCookies(res, result);

    return new ApiResponseDto(true, "Login successful", {
      user: result.user,
    });
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Logout current session" })
  @ApiOkResponse({
    description: "Logout successful",
    type: MessageResponseDto,
  })
  async logout(
    @CurrentUser() user: { userId: string; email: string; role: string },
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const accessToken = req.cookies?.access_token;
    const refreshToken =
      refreshTokenDto.refreshToken || req.cookies?.refresh_token;

    await this.authService.logout(user.userId, accessToken, refreshToken, req);

    // clear cookies
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");

    return new ApiResponseDto(true, "Logged out successfully");
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RefreshTokenDto })
  @ApiOperation({ summary: "Refresh access token" })
  @ApiOkResponse({
    description: "Token refreshed successfully",
    type: MessageResponseDto,
  })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken =
      refreshTokenDto.refreshToken || req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException("No refresh token provided");
    }

    const tokens = await this.authService.refresh(refreshToken);
    res.cookie("access_token", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    return new ApiResponseDto(true, "Token refreshed");
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current authenticated user" })
  @ApiOkResponse({
    description: "Current authenticated user",
    type: CurrentUserResponseDto,
  })
  async me(
    @CurrentUser() user: { userId: string; email: string; role: string },
  ) {
    const fullUser = await this.usersService.findById(user.userId);
    const resolved = {
      ...fullUser,
      avatarUrl:
        this.storageService.resolveAvatarUrl(fullUser.avatarUrl) ?? undefined,
    };
    return new ApiResponseDto(true, "User fetched", resolved);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request a password reset link" })
  @ApiOkResponse({
    description: "Reset notification sent if email is registered",
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return new ApiResponseDto(
      true,
      "If that email is registered, a reset link has been sent",
    );
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset password using a one-time token" })
  @ApiOkResponse({ description: "Password updated successfully" })
  @ApiResponse({ status: 400, description: "Token invalid or expired" })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return new ApiResponseDto(true, "Password updated successfully");
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Change the current user's password" })
  @ApiOkResponse({ description: "Password changed successfully" })
  @ApiResponse({ status: 400, description: "Current password is incorrect" })
  async changePassword(
    @CurrentUser() user: { userId: string },
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(
      user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
    return new ApiResponseDto(true, "Password changed successfully");
  }

  @Roles("group_admin")
  @Get("admin-only")
  @ApiBearerAuth()
  getAdminData() {
    return "Only admins";
  }
}
