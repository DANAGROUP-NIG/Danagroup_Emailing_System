import { Injectable } from "@nestjs/common";
import { PassportSerializer } from "@nestjs/passport";

import { UsersService } from "../users/users.service";

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  serializeUser(
    user: { id: string; email: string; role: string },
    done: (err: Error | null, id?: string) => void,
  ): void {
    done(null, user.id);
  }

  async deserializeUser(
    userId: string,
    done: (
      err: Error | null,
      user?: { id: string; email: string; role: string },
    ) => void,
  ): Promise<void> {
    try {
      const user = await this.usersService.findById(userId);

      if (!user || !user.isActive) {
        return done(null, undefined);
      }

      done(null, {
        id: user.id,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      done(error as Error);
    }
  }
}
