import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  RawBodyRequest,
  Req,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Public } from "@common/decorators/public.decorator";
import type { Request } from "express";
import { InboundMailService } from "./inbound-mail.service";

@ApiTags("mail-inbound")
@Controller("mail/inbound")
export class InboundMailController {
  private readonly logger = new Logger(InboundMailController.name);

  constructor(
    private readonly inboundMailService: InboundMailService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary:
      "Inbound email webhook — called by Postfix/MTA with raw RFC 2822 email",
  })
  async receive(
    @Req() req: RawBodyRequest<Request>,
    @Headers("x-inbound-secret") secret?: string,
  ): Promise<{ ok: boolean }> {
    // Verify shared secret so only Postfix (on the same host) can call this
    const expectedSecret = this.configService.get<string>(
      "INBOUND_WEBHOOK_SECRET",
    );
    if (expectedSecret && secret !== expectedSecret) {
      this.logger.warn("Inbound webhook called with invalid secret");
      throw new BadRequestException("Invalid inbound secret");
    }

    const rawBody = req.rawBody;
    if (!rawBody?.length) {
      throw new BadRequestException("Empty request body");
    }

    try {
      await this.inboundMailService.processRaw(rawBody);
      return { ok: true };
    } catch (err) {
      this.logger.error(
        `Failed to process inbound email: ${(err as Error).message}`,
      );
      throw err;
    }
  }
}
