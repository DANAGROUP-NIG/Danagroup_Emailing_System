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
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { ApiResponseDto } from "@common/dto/api-response.dto";
import { Throttle } from "@nestjs/throttler";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // TODO: Implement POST /auth/login
  // - Validate credentials via AuthService.login
  // - Set httpOnly access_token cookie
  // - Set httpOnly refresh_token cookie
  // - Return user object
  @Throttle(100, 60_000)
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with email and password" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(@Body() loginDto: LoginDto) {
    // TODO: Implement
    const user = await this.authService.ValidateUser(loginDto.email, loginDto.password);

    if (!user) throw new UnauthorizedException("Invalid credentials");

    const result = await this.authService.Login(user);

    return new ApiResponseDto(true, "Login successful", result)
  }

  // TODO: Implement POST /auth/logout
  // - Clear access_token and refresh_token cookies
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Logout current session" })
  async logout(@Res({ passthrough: true }) res: any) {
    // TODO: Implement
     return this.authService.logout(req.user.sub, token);
  }

  // TODO: Implement POST /auth/refresh
  // - Accept refresh token from cookie or body
  // - Return new access_token
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token" })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    // TODO: Implement
  }

  // TODO: Implement GET /auth/me
  // - Protected route (JWT guard)
  // - Returns current authenticated user
  @Get("me")
  @ApiOperation({ summary: "Get current authenticated user" })
  async me(@Req() req: any) {
    // TODO: Implement
  }
}
