import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import Redis from "ioredis";

// TODO: Implement JWT Strategy
// - Extract JWT from Authorization Bearer header OR httpOnly cookie 'access_token'
// - Validate payload: return { userId, email, role } for req.user

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly redis: Redis;

  constructor(config: ConfigService) {
    const secret = config.get<string>("JWT_SECRET");

    if (!secret) {
      throw new Error("JWT_SECRET is not defined");
    }

    const redisPassword = config.get<string>("REDIS_PASSWORD", "");
    const redisUrl =
      config.get<string>("REDIS_URL") ||
      (redisPassword
        ? `redis://:${redisPassword}@${config.get("REDIS_HOST", "localhost")}:${config.get("REDIS_PORT", "6379")}`
        : `redis://${config.get("REDIS_HOST", "localhost")}:${config.get("REDIS_PORT", "6379")}`);

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractAccessToken,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      passReqToCallback: true,
      secretOrKey: secret,
    });

    this.redis = new Redis(redisUrl);
    this.redis.on("error", (error) => {
      console.error("Redis JWT blacklist client error:", error);
    });
  }

  private static extractAccessToken(req: Request) {
    const cookieToken = req?.cookies?.access_token;
    if (cookieToken) {
      return cookieToken;
    }

    const authHeader = req?.headers?.authorization;
    if (typeof authHeader === "string" && authHeader.trim()) {
      return authHeader.replace(/^Bearer\s+/i, "");
    }

    return null;
  }

  async validate(
    req: Request,
    payload: { sub: string; email: string; role: string },
  ) {
    const token = JwtStrategy.extractAccessToken(req);

    if (token && (await this.redis.get(`bl:${token}`))) {
      throw new UnauthorizedException("Token has been revoked");
    }

    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
