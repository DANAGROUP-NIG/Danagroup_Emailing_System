import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from "@nestjs/swagger";
import { FilesService } from "./files.service";

@ApiTags("files")
@ApiBearerAuth()
@Controller("files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  // TODO: POST /files/upload — upload a file to MinIO
  // - UseInterceptors(FileInterceptor('file'))
  // - Validate: max 25MB, allowed MIME types (pdf, doc, docx, images, xlsx, zip)
  // - Store in MinIO, create Attachment record
  // - Returns { id, filename, sizeBytes, mimeType }
  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload a file attachment" })
  async upload(@UploadedFile() file: Express.Multer.File) {
    // TODO: Implement
  }

  // TODO: GET /files/:id/download — get signed URL from MinIO
  @Get(":id/download")
  @ApiOperation({ summary: "Get download URL for attachment" })
  async getDownloadUrl(@Param("id") id: string) {
    // TODO: Implement
  }

  // TODO: DELETE /files/:id — delete attachment from MinIO + DB (owner only)
  @Delete(":id")
  @ApiOperation({ summary: "Delete attachment" })
  async remove(@Param("id") id: string) {
    // TODO: Implement
  }
}
