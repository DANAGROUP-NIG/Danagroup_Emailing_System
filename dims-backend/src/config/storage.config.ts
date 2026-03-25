import { ConfigService } from "@nestjs/config";
import * as Minio from "minio";

export const createMinioClient = (config: ConfigService): Minio.Client => {
  return new Minio.Client({
    endPoint: config.get("MINIO_ENDPOINT", "localhost"),
    port: config.get<number>("MINIO_PORT", 9000),
    useSSL: config.get("MINIO_USE_SSL", "false") === "true",
    accessKey: config.get("MINIO_ACCESS_KEY", "minio_admin"),
    secretKey: config.get("MINIO_SECRET_KEY", "minio_password"),
  });
};

export const MINIO_CLIENT = "MINIO_CLIENT";
export const MINIO_BUCKET = "MINIO_BUCKET";
