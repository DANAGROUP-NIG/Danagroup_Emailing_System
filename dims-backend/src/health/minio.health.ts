import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import axios from 'axios';

@Injectable()
export class MinioHealthIndicator {
  constructor(private healthIndicatorService: HealthIndicatorService) {}

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await axios.get('http://minio:9000/minio/health/live');

      return indicator.up();
    } catch (error) {
      return indicator.down({
        message: 'MinIO unreachable',
      });
    }
  }
}