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
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
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

type AuthenticatedRequest = Request & {
  user: UserShape;
};

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(AuthGuard("local"))
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginDto })
  @ApiOperation({ summary: "Login with email and password" })
  @ApiOkResponse({
    description: "Login successful",
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(
    @Body() _loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: AuthenticatedRequest,
  ) {
    const result = await this.authService.login(
      req.user,
      req.headers["user-agent"],
      req.ip,
      req,
    );

    // Set Cookies
    res.cookie("access_token", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 min
    });

    res.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

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
      avatarUrl: this.storageService.resolveAvatarUrl(fullUser.avatarUrl) ?? undefined,
    };
    return new ApiResponseDto(true, "User fetched", resolved);
  }

  @Roles("group_admin")
  @Get("admin-only")
  @ApiBearerAuth()
  getAdminData() {
    return "Only admins";
  }
}
