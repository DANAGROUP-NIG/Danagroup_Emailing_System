import "express-session";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";

import { UsersService } from "../users/users.service";
import Redis from "ioredis";
import { UserRole } from "@modules/users/entities/user.entity";
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
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  sessions?: {
    refreshToken: string;
    userAgent: string;
    ip: string;
  }[];
}
@Injectable()
export class AuthService {
  private redis: Redis;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
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

  async login(user: UserShape, userAgent?: string, ip?: string, req?: Request) {
    //Fetch the complete user from the database to get all missing fields
    const fullUser = await this.usersService.findById(user.id);

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

      // find matching sessions

      let sessionIndex = -1;
      for (let i = 0; i < user.sessions.length; i++) {
        const match = await bcrypt.compare(
          refreshToken,
          user.sessions[i].refreshToken,
        );

        if (match) {
          sessionIndex = i;
          break;
        }
      }

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
      const filteredSessions = [];
      for (const session of user.sessions) {
        const match = await bcrypt.compare(refreshToken, session.refreshToken);
        if (!match) {
          filteredSessions.push(session);
        }
      }

      await this.usersService.updateAuthState(userId, {
        sessions: filteredSessions,
      });

      return { message: "Logged out successfully" };
    }

    return { message: "Logged out successfully" };
  }
}
