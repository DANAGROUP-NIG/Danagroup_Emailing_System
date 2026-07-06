import { IsOptional, IsString, MaxLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateSignatureDto {
  @ApiPropertyOptional({
    description: "HTML email signature (null/empty to clear)",
    example: "<p>Best regards,<br><strong>John Doe</strong></p>",
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  signature?: string;
}
