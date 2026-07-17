import {
  Controller,
  Post,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from "@nestjs/swagger";
import { ContactsService } from "./contacts.service";
import { JwtAuthGuard } from "@common/guards/jwt-auth.guard";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { FileInterceptor } from "@nestjs/platform-express";
import { Express } from "express";

@ApiTags("contacts")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("contacts")
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get("search")
  @ApiOperation({ summary: "Search personal contacts" })
  async search(
    @CurrentUser() user: { userId: string },
    @Query("q") query: string,
    @Query("limit") limit?: number,
  ) {
    const contacts = await this.contactsService.search(
      user.userId,
      query,
      limit,
    );
    return { data: contacts };
  }

  @Post("import")
  @ApiOperation({ summary: "Import contacts from CSV" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  async importCsv(
    @CurrentUser() user: { userId: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    // Accept any CSV-like MIME type — browsers report different types for the same file
    const allowedMimes = [
      "text/csv",
      "text/plain",
      "application/csv",
      "application/vnd.ms-excel",
      "application/octet-stream",
    ];
    const originalName = file.originalname?.toLowerCase() ?? "";
    const hasValidExt = originalName.endsWith(".csv");
    const hasValidMime = allowedMimes.includes(file.mimetype);

    if (!hasValidExt && !hasValidMime) {
      throw new BadRequestException("Only CSV files are allowed");
    }

    return this.contactsService.importCsv(user.userId, file.buffer);

  }
}
