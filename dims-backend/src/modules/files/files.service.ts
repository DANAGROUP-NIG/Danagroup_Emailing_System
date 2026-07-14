import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Attachment } from "./entities/attachment.entity";
import { Message } from "../mail/entities/message.entity";
import { StorageService } from "@modules/storage/storage.service";

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentRepo: Repository<Attachment>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    private readonly storageService: StorageService,
  ) {}

  async upload(file: Express.Multer.File, uploaderId: string) {
    const result = await this.storageService.uploadAttachment(file);

    const attachment = this.attachmentRepo.create({
      uploaderId,
      filename: file.originalname,
      mime_type: file.mimetype,
      sizeBytes: file.size,
      storageKey: result.storageKey,
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

    const url = await this.storageService.getPresignedDownloadUrl(
      attachment.storageKey,
      3600,
    );

    return {
      data: {
        id: attachment.id,
        url,
        expiresIn: 3600,
      },
    };
  }

  async getStream(attachmentId: string, requesterId: string) {
    const attachment = await this.attachmentRepo.findOne({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new NotFoundException("Attachment not found");
    }

    await this.assertCanAccessAttachment(attachment, requesterId);

    const stream = await this.storageService.getObjectStream(
      attachment.storageKey,
    );

    return { attachment, stream };
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

    await this.storageService.delete(attachment.storageKey);
    await this.attachmentRepo.delete(attachmentId);

    return {
      data: {
        id: attachmentId,
        deleted: true,
      },
    };
  }

  async uploadAvatar(file: Express.Multer.File, uploaderId: string) {
    const result = await this.storageService.uploadAvatar(file, uploaderId);
    return { storageKey: result.storageKey };
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
        url: this.storageService.getPublicUrl(attachment.storageKey),
        messageId: attachment.messageId,
        createdAt: attachment.createdAt,
      },
    };
  }
}
