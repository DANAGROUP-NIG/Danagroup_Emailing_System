import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HealthIndicatorService } from "@nestjs/terminus";
import axios from "axios";

@Injectable()
export class MinioHealthIndicator {
  constructor(
    private healthIndicatorService: HealthIndicatorService,
    private configService: ConfigService,
  ) {}

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);

    try {
      // await axios.get('http://minio:9000/minio/health/live');

      const endpoint = this.configService.get("MINIO_ENDPOINT");
      const port = this.configService.get("MINIO_PORT");
      const url = `http://${endpoint}:${port}/minio/health/live`; // Added http://
      await axios.get(url);

      return indicator.up();
    } catch (error) {
      return indicator.down({
        message: "MinIO unreachable",
      });
    }
  }
}
