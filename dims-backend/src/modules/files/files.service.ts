import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as Minio from "minio";
import { v4 as uuid } from "uuid";
import { Attachment } from "./entities/attachment.entity";
import { MINIO_CLIENT, MINIO_BUCKET } from "../../config/storage.config";
import { Message } from "../mail/entities/message.entity";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024;

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentRepo: Repository<Attachment>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @Inject(MINIO_CLIENT) private readonly minioClient: Minio.Client,
    @Inject(MINIO_BUCKET) private readonly bucket: string,
  ) {}

  async upload(file: Express.Multer.File, uploaderId: string) {
    this.validateUpload(file);
    await this.ensureBucket();

    const safeFilename = file.originalname.replace(/[^\w.\-]/g, "_");
    const storageKey = `uploads/${uuid()}/${safeFilename}`;

    await this.minioClient.putObject(
      this.bucket,
      storageKey,
      file.buffer,
      file.size,
      {
        "Content-Type": file.mimetype,
      },
    );

    const attachment = this.attachmentRepo.create({
      uploaderId,
      filename: file.originalname,
      mime_type: file.mimetype,
      sizeBytes: file.size,
      storageKey,
      messageId: null,
    });

    const saved = await this.attachmentRepo.save(attachment);
    return this.toResponse(saved);
  }

  async getDownloadUrl(attachmentId: string, requesterId: string) {
    const attachment = await this.attachmentRepo.findOne({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new NotFoundException("Attachment not found");
    }

    await this.assertCanAccessAttachment(attachment, requesterId);

    const url = await this.minioClient.presignedGetObject(
      this.bucket,
      attachment.storageKey,
      60 * 60,
    );

    return {
      data: {
        id: attachment.id,
        url,
        expiresIn: 3600,
      },
    };
  }

  async delete(attachmentId: string, requesterId: string) {
    const attachment = await this.attachmentRepo.findOne({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new NotFoundException("Attachment not found");
    }

    if (attachment.uploaderId !== requesterId) {
      throw new ForbiddenException(
        "You do not have permission to delete this attachment",
      );
    }

    await this.minioClient.removeObject(this.bucket, attachment.storageKey);
    await this.attachmentRepo.delete(attachmentId);

    return {
      data: {
        id: attachmentId,
        deleted: true,
      },
    };
  }

  private validateUpload(file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("File is required");
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException("Unsupported file type");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException("File exceeds 25MB limit");
    }
  }

  private async ensureBucket() {
    const exists = await this.minioClient.bucketExists(this.bucket);
    if (!exists) {
      await this.minioClient.makeBucket(this.bucket);
    }
  }

  private async assertCanAccessAttachment(
    attachment: Attachment,
    requesterId: string,
  ) {
    if (attachment.uploaderId === requesterId) {
      return;
    }

    if (!attachment.messageId) {
      throw new ForbiddenException("You do not have access to this attachment");
    }

    const message = await this.messageRepo.findOne({
      where: { id: attachment.messageId },
      relations: {
        recipients: true,
      },
    });

    if (!message) {
      throw new NotFoundException("Attachment message not found");
    }

    const isSender = message.senderId === requesterId;
    const isRecipient = message.recipients?.some(
      (recipient) =>
        recipient.recipientId === requesterId && recipient.isDeleted === false,
    );

    if (!isSender && !isRecipient) {
      throw new ForbiddenException("You do not have access to this attachment");
    }
  }

  private toResponse(attachment: Attachment) {
    return {
      data: {
        id: attachment.id,
        filename: attachment.filename,
        mimeType: attachment.mime_type,
        sizeBytes: Number(attachment.sizeBytes),
        storageKey: attachment.storageKey,
        messageId: attachment.messageId,
        createdAt: attachment.createdAt,
      },
    };
  }
}
