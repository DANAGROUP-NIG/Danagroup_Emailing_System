import "express-session";
import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";

import { UsersService } from "../users/users.service";
import { TwoFactorService } from "@modules/two-factor/two-factor.service";
import Redis from "ioredis";
import { User, UserRole } from "@modules/users/entities/user.entity";
import { Department } from "@modules/departments/entities/department.entity";
import { Subsidiary } from "@modules/departments/entities/subsidiary.entity";
import { Request } from "express";
import { SignupDto } from "./dto/signup.dto";

export interface UserShape {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  jobTitle?: string;
  avatarUrl?: string;
  departmentId?: string;
  department?: Department;
  subsidiaryId?: string;
  subsidiary?: Subsidiary;
  isActive: boolean;
  totpEnabled: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  sessions?: {
    refreshToken: string;
    userAgent: string;
    ip: string;
  }[];
}

export interface LoginTokens {
  accessToken: string;
  refreshToken: string;
  user: Pick<UserShape, "id" | "email" | "firstName" | "lastName" | "role">;
}

export interface TotpChallenge {
  requires2FA: true;
  email: string;
  challengeToken: string;
}

export type LoginResult = LoginTokens | TotpChallenge;
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private redis: Redis;

  private readonly RESET_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour
  private readonly RESET_TOKEN_PREFIX = "pwd_reset:";

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
    private readonly twoFactorService: TwoFactorService,
  ) {
    const redisPassword = this.config.get<string>("REDIS_PASSWORD", "");
    const redisUrl =
      this.config.get<string>("REDIS_URL") ||
      (redisPassword
        ? `redis://:${redisPassword}@${this.config.get("REDIS_HOST", "localhost")}:${this.config.get("REDIS_PORT", "6379")}`
        : `redis://${this.config.get("REDIS_HOST", "localhost")}:${this.config.get("REDIS_PORT", "6379")}`);

    this.redis = new Redis(redisUrl);
  }

  private async establishSession(req: Request | undefined, user: UserShape) {
    if (!req?.session) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    if (req.logIn) {
      await new Promise<void>((resolve, reject) => {
        req.logIn(user as any, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }

    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) return null;
    if (!user.isActive) return null;

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return null;

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async generateTotpChallengeToken(user: Pick<UserShape, "id" | "email">) {
    return this.jwtService.signAsync(
      { sub: user.id, email: user.email, type: "totp_challenge" },
      {
        secret: this.config.get("JWT_SECRET"),
        expiresIn: "5m",
      },
    );
  }

  verifyTotpChallengeToken(token: string) {
    try {
      return this.jwtService.verify<{ sub: string; email: string; type: string }>(token, {
        secret: this.config.get("JWT_SECRET"),
      });
    } catch {
      return null;
    }
  }

  private async generateTokens(user: Pick<UserShape, "id" | "email" | "role">) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get("JWT_SECRET"),
      expiresIn: "15m",
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get("JWT_REFRESH_SECRET"),
      expiresIn: "7d",
    });

    return { accessToken, refreshToken };
  }

  private async completeLogin(
    fullUser: User,
    userAgent?: string,
    ip?: string,
    req?: Request,
  ): Promise<LoginTokens> {
    const tokens = await this.generateTokens(fullUser);

    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 12);
    const currentSessions = fullUser.sessions ?? [];
    const allSessions = [
      ...currentSessions,
      {
        refreshToken: hashedRefresh,
        userAgent: userAgent || "unknown",
        ip: ip || "unknown",
      },
    ];
    const nextSessions =
      allSessions.length > 5 ? allSessions.slice(-5) : allSessions;

    await this.usersService.updateAuthState(fullUser.id, {
      sessions: nextSessions,
      lastLoginAt: new Date(),
    });

    await this.establishSession(req, fullUser);

    return {
      ...tokens,
      user: {
        id: fullUser.id,
        email: fullUser.email,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        role: fullUser.role,
      },
    };
  }

  async login(
    user: UserShape,
    userAgent?: string,
    ip?: string,
    req?: Request,
  ): Promise<LoginResult> {
    //Fetch the complete user from the database to get all missing fields
    const fullUser = await this.usersService.findById(user.id);

    if (fullUser.totpEnabled) {
      const challengeToken = await this.generateTotpChallengeToken(fullUser);
      return { requires2FA: true, email: fullUser.email, challengeToken };
    }

    return this.completeLogin(fullUser, userAgent, ip, req);
  }

  async verifyTotpAndLogin(
    userId: string,
    token: string,
    userAgent?: string,
    ip?: string,
    req?: Request,
  ) {
    const valid = await this.twoFactorService.validateToken(userId, token);
    if (!valid) {
      throw new UnauthorizedException("Invalid or expired TOTP code");
    }

    const fullUser = await this.usersService.findById(userId);
    return this.completeLogin(fullUser, userAgent, ip, req);
  }

  async signup(dto: SignupDto, userAgent?: string, ip?: string, req?: Request) {
    const employee = await this.usersService.createEmployee(dto);

    return this.login(employee, userAgent, ip, req);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.get<string>("JWT_REFRESH_SECRET"),
      });

      const user = await this.usersService.findById(payload.sub);

      if (!user || !user.isActive || !user.sessions?.length) {
        throw new UnauthorizedException();
      }

      // find matching session — run all compares in parallel
      const matchResults = await Promise.all(
        user.sessions.map((s) => bcrypt.compare(refreshToken, s.refreshToken)),
      );
      const sessionIndex = matchResults.findIndex(Boolean);

      if (sessionIndex === -1) {
        throw new UnauthorizedException();
      }

      const tokens = await this.generateTokens(user);

      // rotate ONLY the matched session
      const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 12);

      user.sessions[sessionIndex].refreshToken = hashedRefresh;

      await this.usersService.updateAuthState(user.id, {
        sessions: user.sessions,
      });

      return tokens;
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async logout(
    userId: string,
    accessToken: string,
    refreshToken: string,
    req?: Request,
  ) {
    if (accessToken) {
      await this.redis.set(
        `bl:${accessToken}`,
        "true",
        "EX",
        60 * 15, // 15 mins (access token expiry)
      );
    }

    const passportLogout = req?.logout ?? req?.logOut;
    if (passportLogout) {
      await new Promise<void>((resolve, reject) => {
        passportLogout.call(req, (err?: unknown) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }

    // Clear express-session (Properly handle the callback)
    if (req?.session) {
      await new Promise<void>((resolve, reject) => {
        req.session.destroy((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }

    //remove refresh token from DB
    const user = await this.usersService.findById(userId);

    if (user?.sessions && refreshToken) {
      const matchResults = await Promise.all(
        user.sessions.map((s) => bcrypt.compare(refreshToken, s.refreshToken)),
      );
      const filteredSessions = user.sessions.filter((_, i) => !matchResults[i]);

      await this.usersService.updateAuthState(userId, {
        sessions: filteredSessions,
      });

      return { message: "Logged out successfully" };
    }

    return { message: "Logged out successfully" };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    // Always resolve silently — never reveal whether the email exists.
    if (!user || !user.isActive) {
      return;
    }

    const token = randomBytes(32).toString("hex");
    const redisKey = `${this.RESET_TOKEN_PREFIX}${token}`;

    await this.redis.set(redisKey, user.id, "EX", this.RESET_TOKEN_TTL_SECONDS);

    const frontendUrl = this.config
      .get<string>("FRONTEND_URL", "http://localhost:3000")
      .split(",")[0]
      .trim();

    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    const expiryMinutes = this.RESET_TOKEN_TTL_SECONDS / 60;

    this.logger.log(
      `Password reset token issued for user ${user.id} (expires in ${expiryMinutes}m)`,
    );

    await this.usersService.deliverPasswordResetNotification(
      user.id,
      resetLink,
      expiryMinutes,
    );
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersService.findByIdWithPassword(userId);
    if (!user) {
      throw new BadRequestException("User not found");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException("Current password is incorrect");
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.usersService.updatePasswordHash(userId, passwordHash);

    this.logger.log(`Password changed for user ${userId}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const redisKey = `${this.RESET_TOKEN_PREFIX}${token}`;
    const userId = await this.redis.get(redisKey);

    if (!userId) {
      throw new BadRequestException("Reset token is invalid or has expired");
    }

    const user = await this.usersService.findById(userId);
    if (!user || !user.isActive) {
      throw new BadRequestException("Reset token is invalid or has expired");
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.usersService.updatePasswordHash(userId, passwordHash);

    // Consume the token — single-use only
    await this.redis.del(redisKey);

    // Invalidate all existing sessions so old tokens can't be reused
    await this.usersService.updateAuthState(userId, { sessions: [] });

    this.logger.log(`Password successfully reset for user ${userId}`);
  }
}
