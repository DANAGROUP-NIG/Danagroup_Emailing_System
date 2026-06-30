import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
  Logger,
} from "@nestjs/common";
import { UsersService } from "@modules/users/users.service";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { FilesService } from "./files.service";
import { StorageService } from "@modules/storage/storage.service";
import { Express, Response } from "express";

@ApiTags("files")
@ApiBearerAuth()
@Controller("files")
export class FilesController {
  private readonly logger = new Logger(FilesController.name);

  constructor(
    private readonly filesService: FilesService,
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
  ) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload a file attachment" })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { userId: string },
  ) {
    return this.filesService.upload(file, user.userId);
  }

  @Get(":id/download")
  @ApiOperation({ summary: "Get download URL for attachment" })
  async getDownloadUrl(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.filesService.getDownloadUrl(id, user.userId);
  }

  @Get(":id/stream")
  @ApiOperation({ summary: "Stream or download attachment content" })
  async streamAttachment(
    @Param("id") id: string,
    @Query("download") download: string,
    @CurrentUser() user: { userId: string },
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { attachment, stream } = await this.filesService.getStream(
      id,
      user.userId,
    );

    res.set({
      "Content-Type": attachment.mime_type,
      "Content-Disposition": `${download === "true" ? "attachment" : "inline"}; filename="${attachment.filename}"`,
      "Content-Length": String(attachment.sizeBytes),
    });

    return new StreamableFile(stream);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete attachment" })
  async remove(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.filesService.delete(id, user.userId);
  }

  @Post("avatar")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary:
      "Upload avatar image for the current user (max 5MB, jpeg/png/gif/webp)",
  })
  @ApiResponse({
    status: 201,
    description: "Avatar uploaded and profile updated",
  })
  @ApiResponse({ status: 400, description: "Invalid file type or size" })
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    // Delete old avatar from MinIO if it exists
    const existingUser = await this.usersService.findById(user.userId);
    if (existingUser?.avatarUrl && this.storageService.isStorageKey(existingUser.avatarUrl)) {
      try {
        await this.storageService.delete(existingUser.avatarUrl);
      } catch (err) {
        this.logger.warn(`Failed to delete old avatar: ${(err as Error).message}`);
      }
    }

    const { storageKey } = await this.filesService.uploadAvatar(file, user.userId);

    await this.usersService.update(
      user.userId,
      { avatarUrl: storageKey },
      user.userId,
      user.role,
    );

    const avatarUrl = this.storageService.getPublicUrl(storageKey);
    return { data: { avatarUrl } };
  }
}
