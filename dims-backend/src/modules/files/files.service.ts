import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as Minio from "minio";
import { Attachment } from "./entities/attachment.entity";
import { MINIO_CLIENT, MINIO_BUCKET } from "../../config/storage.config";

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentRepo: Repository<Attachment>,
    @Inject(MINIO_CLIENT) private readonly minioClient: Minio.Client,
    @Inject(MINIO_BUCKET) private readonly bucket: string,
  ) {}

  // TODO: Implement upload(file, uploaderId): Attachment
  //   - Ensure bucket exists (minioClient.bucketExists / makeBucket)
  //   - Generate storageKey: uploads/{uuid}/{filename}
  //   - Put file to MinIO: minioClient.putObject(bucket, storageKey, buffer, size, { contentType })
  //   - Save Attachment record to DB
  //   - Return Attachment

  // TODO: Implement getDownloadUrl(attachmentId, requesterId): string
  //   - Verify requester has access to this attachment's message
  //   - Generate presigned URL: minioClient.presignedGetObject(bucket, storageKey, 3600)

  // TODO: Implement delete(attachmentId, requesterId): void
  //   - Verify requester is owner
  //   - Remove from MinIO: minioClient.removeObject
  //   - Delete DB record
}
