import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // TODO: Implement validateUser(email, password): Promise<User | null>
  // - Find user by email from UsersService
  // - Compare password hash using bcrypt.compare
  // - Return user without password if valid, null otherwise

  // TODO: Implement login(user): Promise<{ accessToken, refreshToken, user }>
  // - Sign JWT access token (payload: { sub: user.id, email, role })
  // - Sign refresh token with longer expiry (JWT_REFRESH_SECRET)
  // - Return both tokens + user object

  // TODO: Implement refresh(refreshToken): Promise<{ accessToken }>
  // - Verify refresh token with JWT_REFRESH_SECRET
  // - Issue new access token

  // TODO: Implement logout(): void
  // - Optionally blacklist refresh token in Redis (for full invalidation)
}
