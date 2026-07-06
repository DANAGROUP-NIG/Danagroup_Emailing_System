import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as OTPAuth from "otpauth";
import * as QRCode from "qrcode";
import { User } from "@modules/users/entities/user.entity";

const APP_NAME = "DIMS — Dana Internal Mail";
const TOKEN_WINDOW = 1; // allow ±1 token period

@Injectable()
export class TwoFactorService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async generateSetup(
    userId: string,
  ): Promise<{ otpauthUrl: string; qrDataUrl: string; secret: string }> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    if (user.totpEnabled) {
      throw new BadRequestException(
        "2FA is already enabled. Disable it first before re-enrolling.",
      );
    }

    const totp = new OTPAuth.TOTP({
      issuer: APP_NAME,
      label: user.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });

    const secret = totp.secret.base32;
    const otpauthUrl = totp.toString();

    // Store pending secret (not yet confirmed)
    await this.userRepo.update(userId, {
      totpSecret: secret,
      totpEnabled: false,
    });

    const qrDataUrl = await QRCode.toDataURL(otpauthUrl, {
      width: 256,
      margin: 1,
    });

    return { otpauthUrl, qrDataUrl, secret };
  }

  async confirmEnable(userId: string, token: string): Promise<void> {
    const user = await this.userRepo
      .createQueryBuilder("user")
      .addSelect("user.totpSecret")
      .where("user.id = :userId", { userId })
      .getOneOrFail();

    if (!user.totpSecret) {
      throw new BadRequestException(
        "No pending 2FA setup found. Call /2fa/setup first.",
      );
    }

    const valid = this.verifyToken(user.totpSecret, token);
    if (!valid) throw new UnauthorizedException("Invalid TOTP code");

    await this.userRepo.update(userId, { totpEnabled: true });
  }

  async disable(userId: string, token: string): Promise<void> {
    const user = await this.userRepo
      .createQueryBuilder("user")
      .addSelect("user.totpSecret")
      .where("user.id = :userId", { userId })
      .getOneOrFail();

    if (!user.totpEnabled) throw new BadRequestException("2FA is not enabled");
    if (!user.totpSecret) throw new BadRequestException("No TOTP secret found");

    const valid = this.verifyToken(user.totpSecret, token);
    if (!valid) throw new UnauthorizedException("Invalid TOTP code");

    await this.userRepo.update(userId, {
      totpSecret: null,
      totpEnabled: false,
    });
  }

  async validateToken(userId: string, token: string): Promise<boolean> {
    const user = await this.userRepo
      .createQueryBuilder("user")
      .addSelect("user.totpSecret")
      .where("user.id = :userId", { userId })
      .getOne();

    if (!user?.totpEnabled || !user.totpSecret) return false;
    return this.verifyToken(user.totpSecret, token);
  }

  private verifyToken(secret: string, token: string): boolean {
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(secret),
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });
    const delta = totp.validate({ token, window: TOKEN_WINDOW });
    return delta !== null;
  }
}
