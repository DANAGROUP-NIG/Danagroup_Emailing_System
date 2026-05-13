import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
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
import { Express } from "express";

@ApiTags("files")
@ApiBearerAuth()
@Controller("files")
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly usersService: UsersService,
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
    const { storageKey } = await this.filesService.uploadAvatar(
      file,
      user.userId,
    );
    await this.usersService.update(
      user.userId,
      { avatarUrl: storageKey },
      user.userId,
      user.role,
    );
    return { data: { avatarUrl: storageKey } };
  }
}
