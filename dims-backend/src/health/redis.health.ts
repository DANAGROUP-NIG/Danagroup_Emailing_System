import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HealthIndicatorService } from "@nestjs/terminus";
import Redis from "ioredis";

@Injectable()
export class RedisHealthIndicator {
  // ✅ Correct: Define the type, don't assign the class itself
  private client: Redis;

  constructor(
    private healthIndicatorService: HealthIndicatorService,
    private configService: ConfigService,
  ) {
    const redisUrl = this.configService.get<string>("REDIS_URL");
    // ✅ This now correctly assigns the instance to the client property
    this.client = new Redis(redisUrl || "redis://localhost:6379");
  }

  async isHealthy(key: string) {
    // Use the service to create the indicator
    const indicator = this.healthIndicatorService.check(key);

    try {
      const res = await this.client.ping();
      if (res === "PONG") {
        return indicator.up(); // Returns { [key]: { status: 'up' } }
      }
      return indicator.down();
    } catch (error) {
      return indicator.down({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
