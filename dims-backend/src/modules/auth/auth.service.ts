import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";


import { UsersService } from "../users/users.service";
import Redis from "ioredis";
import { UserRole } from "@modules/users/entities/user.entity";
import { Department } from "@modules/departments/entities/department.entity";
import { Subsidiary } from "@modules/departments/entities/subsidiary.entity";

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
    this.redis = new Redis({
      host: this.config.get("REDIS_HOST") || "redis",
      port: this.config.get("REDIS_PORT") || 6379,
    });
  }

  // TODO: Implement validateUser(email, password): Promise<User | null>
  // - Find user by email from UsersService
  // - Compare password hash using bcrypt.compare
  // - Return user without password if valid, null otherwise
  async validateUser (email:string, password:string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) return null;

    const { passwordHash: _, ...result } = user;
    return result
  };
  


  private async generateTokens(user:any) {
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

    return { accessToken, refreshToken}
  }


  
  // TODO: Implement login(user): Promise<{ accessToken, refreshToken, user }>
  // - Sign JWT access token (payload: { sub: user.id, email, role })
  // - Sign refresh token with longer expiry (JWT_REFRESH_SECRET)
  // - Return both tokens + user object
  async login(user: UserShape, userAgent?: string, ip?: string) {
    //Fetch the complete user from the database to get all missing fields
    const fullUser = await this.usersService.findById(user.id);

    const tokens = await this.generateTokens(fullUser);

    //hash refreshToken before storing
    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 12);

    await this.usersService.update(user.id, {
      sessions: [
        ...(user.sessions || []),
        {
          refreshToken: hashedRefresh,
          userAgent: userAgent || "unkwown",
          ip: ip || "unknown"
        },
      ],
    });

    return {
      ...tokens,
      user: fullUser
    };
  }




  // TODO: Implement refresh(refreshToken): Promise<{ accessToken }>
  // - Verify refresh token with JWT_REFRESH_SECRET
  // - Issue new access token
  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.get<string>("JWT_REFRESH_SECRET"),
      });

      const user = await this.usersService.findById(payload.sub);

      if (!user || !user.sessions?.length) {
        throw new UnauthorizedException();
      }

      // find matching sessions

      let sessionIndex = -1;
      for (let i = 0; i < user.sessions.length; i++) {
        const match = await bcrypt.compare(
          refreshToken,
          user.sessions[i].refreshToken
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


      await this.usersService.update(user.id, {
        sessions: user.sessions,
      });

      return tokens;

    } catch {
      throw  new UnauthorizedException("Invalid refresh token");
    }
  }



  // TODO: Implement logout(): void
  // - Optionally blacklist refresh token in Redis (for full invalidation)
  async logout(userId: string, accessToken: string, refreshToken: string) {
    //blacklist access token
    await this.redis.set(
      `bl: ${accessToken}`,
      "true",
      "EX",
      60 * 15 // 15 mins (access token expiry)
    );

    //remove refresh token
    const user = await this.usersService.findById(userId);

    const filteredSessions = [];

    for (const session of user.sessions || []) {
      const match = await bcrypt.compare(refreshToken, session.refreshToken);
      if (!match) {
        filteredSessions.push(session);
      }
    }


    await this.usersService.update(userId, {
      sessions: filteredSessions,
    });

    return { message: "Logged out successfully"}

  }

  
}
