import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { FilesService } from "./files.service";
import { Express } from "express";

@ApiTags("files")
@ApiBearerAuth()
@Controller("files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

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
}
