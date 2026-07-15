import { Module } from "@nestjs/common";
import { BrandingController } from "./branding.controller";
import { DepartmentsModule } from "@modules/departments/departments.module";

@Module({
  imports: [DepartmentsModule],
  controllers: [BrandingController],
})
export class BrandingModule {}
