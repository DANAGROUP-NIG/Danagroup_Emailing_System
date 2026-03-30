import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import axios from 'axios';

@Injectable()
export class ElasticsearchHealthIndicator {
  constructor(private healthIndicatorService: HealthIndicatorService) {}

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);

    try {
      const res = await axios.get('http://elasticsearch:9200/_cluster/health');
      const esStatus = res.data.status;

      if (esStatus === 'green' || esStatus === 'yellow') {
        return indicator.up({
          elasticStatus: esStatus,
        });
      }

      return indicator.down({
        elasticStatus: esStatus, 
      });
    } catch (error) {
      return indicator.down('Elasticsearch unreachable');
    }
  }
}