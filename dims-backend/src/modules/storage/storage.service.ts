import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import * as Minio from "minio";
import { Readable } from "stream";
import { v4 as uuid } from "uuid";
import { MINIO_CLIENT, MINIO_BUCKET } from "../../config/storage.config";

export interface UploadOptions {
  folder?: string;
  filename?: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  storageKey: string;
  bucket: string;
  size: number;
  contentType: string;
  filename: string;
}

const ALLOWED_ATTACHMENT_TYPES = new Set([
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

const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    @Inject(MINIO_CLIENT) private readonly minioClient: Minio.Client,
    @Inject(MINIO_BUCKET) private readonly bucket: string,
  ) {}

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  async onModuleInit(): Promise<void> {
    try {
      await this.ensurePublicReadPolicy();
      this.logger.log(`Bucket policy applied for bucket: ${this.bucket}`);
    } catch (err) {
      this.logger.warn(`Could not apply bucket policy on init: ${(err as Error).message}`);
    }
  }

  // ─── Bucket lifecycle ──────────────────────────────────────────────────────

  async ensureBucket(bucketName?: string): Promise<void> {
    const target = bucketName ?? this.bucket;
    const exists = await this.minioClient.bucketExists(target);
    if (!exists) {
      await this.minioClient.makeBucket(target);
      this.logger.log(`Bucket created: ${target}`);
    }
  }

  async ensurePublicReadPolicy(bucketName?: string): Promise<void> {
    const target = bucketName ?? this.bucket;
    await this.ensureBucket(target);
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [
            `arn:aws:s3:::${target}/avatars/*`,
            `arn:aws:s3:::${target}/attachments/*`,
            `arn:aws:s3:::${target}/uploads/*`,
            `arn:aws:s3:::${target}/logos/*`,
          ],
        },
      ],
    };
    await this.minioClient.setBucketPolicy(target, JSON.stringify(policy));
  }

  // ─── Core upload ──────────────────────────────────────────────────────────

  async uploadBuffer(
    buffer: Buffer,
    size: number,
    contentType: string,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    await this.ensureBucket();

    const folder = options.folder ?? "uploads";
    const originalFilename = options.filename ?? "file";
    const safeFilename = originalFilename.replace(/[^\w.\-]/g, "_");
    const ext =
      safeFilename
        .split(".")
        .pop()
        ?.replace(/[^a-z0-9]/gi, "") ?? "bin";
    const uniqueName = options.filename
      ? `${uuid()}.${ext}`
      : `${uuid()}/${safeFilename}`;
    const storageKey = `${folder}/${uniqueName}`;

    const meta: Record<string, string> = {
      "Content-Type": contentType,
      ...(options.metadata ?? {}),
    };

    await this.minioClient.putObject(
      this.bucket,
      storageKey,
      buffer,
      size,
      meta,
    );

    this.logger.log(`Uploaded ${storageKey} (${size} bytes)`);

    return {
      storageKey,
      bucket: this.bucket,
      size,
      contentType,
      filename: originalFilename,
    };
  }

  async uploadStream(
    stream: Readable,
    size: number,
    contentType: string,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    await this.ensureBucket();

    const folder = options.folder ?? "uploads";
    const originalFilename = options.filename ?? "file";
    const safeFilename = originalFilename.replace(/[^\w.\-]/g, "_");
    const storageKey = `${folder}/${uuid()}/${safeFilename}`;

    const meta: Record<string, string> = {
      "Content-Type": contentType,
      ...(options.metadata ?? {}),
    };

    await this.minioClient.putObject(
      this.bucket,
      storageKey,
      stream,
      size,
      meta,
    );

    this.logger.log(`Uploaded (stream) ${storageKey} (${size} bytes)`);

    return {
      storageKey,
      bucket: this.bucket,
      size,
      contentType,
      filename: originalFilename,
    };
  }

  // ─── Validated domain uploads ─────────────────────────────────────────────

  validateAttachment(file: Express.Multer.File): void {
    if (!file) throw new BadRequestException("File is required");
    if (!ALLOWED_ATTACHMENT_TYPES.has(file.mimetype))
      throw new BadRequestException("Unsupported file type");
    if (file.size > MAX_ATTACHMENT_SIZE)
      throw new BadRequestException("File exceeds 20 MB limit");
  }

  validateAvatar(file: Express.Multer.File): void {
    if (!file) throw new BadRequestException("File is required");
    if (!ALLOWED_AVATAR_TYPES.has(file.mimetype))
      throw new BadRequestException("Avatar must be jpeg, png, gif, or webp");
    if (file.size > MAX_AVATAR_SIZE)
      throw new BadRequestException("Avatar exceeds 5 MB limit");
  }

  async uploadAttachment(file: Express.Multer.File): Promise<UploadResult> {
    this.validateAttachment(file);
    return this.uploadBuffer(file.buffer, file.size, file.mimetype, {
      folder: "attachments",
      filename: file.originalname,
    });
  }

  async uploadAvatar(
    file: Express.Multer.File,
    userId: string,
  ): Promise<UploadResult> {
    this.validateAvatar(file);

    const ext =
      file.originalname
        .split(".")
        .pop()
        ?.replace(/[^a-z0-9]/gi, "") ?? "jpg";

    return this.uploadBuffer(file.buffer, file.size, file.mimetype, {
      folder: `avatars/${userId}`,
      filename: `${uuid()}.${ext}`,
      metadata: { "x-amz-acl": "public-read" },
    });
  }

  async uploadExport(
    buffer: Buffer,
    filename: string,
    contentType: string,
  ): Promise<UploadResult> {
    return this.uploadBuffer(buffer, buffer.length, contentType, {
      folder: "exports",
      filename,
    });
  }

  async uploadImport(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadBuffer(file.buffer, file.size, file.mimetype, {
      folder: "imports",
      filename: file.originalname,
    });
  }

  async uploadBranding(
    file: Express.Multer.File,
    subsidiaryId: string,
    type: "logo" | "favicon",
  ): Promise<UploadResult> {
    this.validateAvatar(file);
    const ext =
      file.originalname
        .split(".")
        .pop()
        ?.replace(/[^a-z0-9]/gi, "") ?? "png";
    return this.uploadBuffer(file.buffer, file.size, file.mimetype, {
      folder: `logos/${subsidiaryId}`,
      filename: `${type}-${uuid()}.${ext}`,
      metadata: { "x-amz-acl": "public-read" },
    });
  }

  // ─── Download / URL ───────────────────────────────────────────────────────

  async getPresignedDownloadUrl(
    storageKey: string,
    expirySeconds: number = 3600,
  ): Promise<string> {
    const presigned = await this.minioClient.presignedGetObject(
      this.bucket,
      storageKey,
      expirySeconds,
    );

    const publicBase = process.env.MINIO_PUBLIC_URL;
    if (publicBase) {
      const presignedUrl = new URL(presigned);
      const publicUrl = new URL(publicBase.replace(/\/$/, ""));
      presignedUrl.protocol = publicUrl.protocol;
      presignedUrl.hostname = publicUrl.hostname;
      presignedUrl.port = publicUrl.port;
      if (publicUrl.pathname && publicUrl.pathname !== "/") {
        presignedUrl.pathname =
          publicUrl.pathname.replace(/\/$/, "") + presignedUrl.pathname;
      }
      return presignedUrl.toString();
    }

    return presigned;
  }

  async getObjectStream(storageKey: string): Promise<Readable> {
    return this.minioClient.getObject(this.bucket, storageKey);
  }

  getPublicUrl(storageKey: string): string {
    const endpoint = process.env.MINIO_PUBLIC_URL;
    if (endpoint) {
      return `${endpoint.replace(/\/$/, "")}/${this.bucket}/${storageKey}`;
    }
    const host = process.env.MINIO_ENDPOINT ?? "localhost";
    const port = process.env.MINIO_PORT ?? "9000";
    const ssl = process.env.MINIO_USE_SSL === "true";
    const scheme = ssl ? "https" : "http";
    return `${scheme}://${host}:${port}/${this.bucket}/${storageKey}`;
  }

  isStorageKey(value: string): boolean {
    return (
      value.startsWith("avatars/") ||
      value.startsWith("attachments/") ||
      value.startsWith("uploads/") ||
      value.startsWith("exports/") ||
      value.startsWith("imports/") ||
      value.startsWith("logos/") ||
      value.startsWith("signatures/")
    );
  }

  resolveAvatarUrl(avatarUrl?: string | null): string | null {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
      return avatarUrl;
    }
    if (this.isStorageKey(avatarUrl)) {
      return this.getPublicUrl(avatarUrl);
    }
    return avatarUrl;
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async delete(storageKey: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucket, storageKey);
      this.logger.log(`Deleted ${storageKey}`);
    } catch (err) {
      this.logger.warn(
        `Failed to delete ${storageKey}: ${(err as Error).message}`,
      );
    }
  }

  async deleteMany(storageKeys: string[]): Promise<void> {
    if (!storageKeys.length) return;
    await this.minioClient.removeObjects(this.bucket, storageKeys);
  }

  // ─── Object existence ─────────────────────────────────────────────────────

  async exists(storageKey: string): Promise<boolean> {
    try {
      await this.minioClient.statObject(this.bucket, storageKey);
      return true;
    } catch {
      return false;
    }
  }
}
