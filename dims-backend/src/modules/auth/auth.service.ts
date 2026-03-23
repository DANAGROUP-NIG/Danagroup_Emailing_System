import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";


import { UsersService } from "../users/users.service";
import Redis from "ioredis";

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
  async ValidateUser (email:string, password:string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return null;

    const { password: _, ...result } = user;
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
      secret: this.config.get("JWT_REFRESH_TOKEN"),
      expiresIn: "7d",
    });

    return { accessToken, refreshToken}
  }


  
  // TODO: Implement login(user): Promise<{ accessToken, refreshToken, user }>
  // - Sign JWT access token (payload: { sub: user.id, email, role })
  // - Sign refresh token with longer expiry (JWT_REFRESH_SECRET)
  // - Return both tokens + user object
  async Login(user: any) {
    const tokens = await this.generateTokens(user);

    //hash refreshToken before storing
    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 12);

    await this.usersService.update(user.id, {
      refreshToken: hashedRefresh,
    });

    return {
      ...tokens,
      user
    };
  }




  // TODO: Implement refresh(refreshToken): Promise<{ accessToken }>
  // - Verify refresh token with JWT_REFRESH_SECRET
  // - Issue new access token
  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.get("JWT_REFRESH_SECRET"),
      });

      const user = await this.usersService.findByID(payload.sub);

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException();
      }

      const isValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken
      );

      if (!isValid) {
        throw new UnauthorizedException();
      }

      const tokens = await this.generateTokens(user);

      //rotate refreshToken
      const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 12);

      await this.usersService.update(user.id, {
        refreshToken: hashedRefresh,
      });

      return tokens;

    } catch (error) {
      throw  new UnauthorizedException("Invalid refresh token");
    }
  }



  // TODO: Implement logout(): void
  // - Optionally blacklist refresh token in Redis (for full invalidation)
  async logOut(userId: string, accessToken: string) {
    //blacklist access token
    await this.redis.set(
      `bl: ${accessToken}`,
      "true",
      "EX",
      60 * 15 // 15 mins (access token expiry)
    );

    //remove refresh token
    await this.usersService.update(userId, {
      refreshToken: null,
    });

    return { message: "Logged out successfully"}

  }

  
}
