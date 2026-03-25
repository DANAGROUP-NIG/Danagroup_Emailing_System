import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator {
  private client = new Redis({
    host: 'redis',
    port: 6379,
  });

  constructor(private healthIndicatorService: HealthIndicatorService) {}

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);

    try {
      const res = await this.client.ping();

      if (res === 'PONG') {
        return indicator.up();
      }

      return indicator.down();
    } catch (error) {
      return indicator.down({
        message: 'Redis not responding',
      });
    }
  }
}