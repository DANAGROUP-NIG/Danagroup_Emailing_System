import { Controller, Get, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiOkResponse } from "@nestjs/swagger";
import { Request } from "express";
import { Public } from "@common/decorators/public.decorator";
import { DepartmentsService } from "@modules/departments/departments.service";

class BrandingResponse {
  name: string;
  logoUrl: string | null;
  faviconUrl: string | null;
}

@ApiTags("branding")
@Controller("branding")
export class BrandingController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Get branding for the current hostname" })
  @ApiOkResponse({ description: "Branding returned", type: BrandingResponse })
  async getBranding(@Req() req: Request): Promise<BrandingResponse> {
    const host = req.headers.host?.split(":")[0] ?? "";
    const subsidiaries = await this.departmentsService.findAllSubsidiaries();

    // Match by exact domain or by hostname containing the domain
    const match = subsidiaries.find(
      (s) =>
        s.domain.toLowerCase() === host.toLowerCase() ||
        host.toLowerCase().endsWith(`.${s.domain.toLowerCase()}`),
    );

    return {
      name: match?.name ?? "DIMS",
      logoUrl: match?.logoUrl ?? null,
      faviconUrl: match?.faviconUrl ?? null,
    };
  }
}
