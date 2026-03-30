import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '@common/decorators/public.decorator';

import { RedisHealthIndicator } from './redis.health';
import { MinioHealthIndicator } from './minio.health';
import { ElasticsearchHealthIndicator } from './elasticsearch.health';

@Controller('health')
@Public()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private redis: RedisHealthIndicator,
    private minio: MinioHealthIndicator,
    private es: ElasticsearchHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('postgres'),
      () => this.redis.isHealthy('redis'),
      () => this.minio.isHealthy('minio'),
      () => this.es.isHealthy('elasticsearch'),
    ]);
  }
}
