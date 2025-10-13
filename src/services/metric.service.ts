import { Injectable } from '@nestjs/common';
import { Contact } from 'src/database/entities/core-app-entities/contact.entity';
import { Deal } from 'src/database/entities/core-app-entities/deal.entity';
import { Lead } from 'src/database/entities/core-app-entities/lead.entity';
import { Ticket } from 'src/database/entities/core-app-entities/ticket.entity';
import { MetricDto } from 'src/dtos/metric-dto/metric.dto';
import { getRepo } from 'src/shared/database-connection/get-connection';
import Redis from 'ioredis';
import { REDIS_CONFIG } from 'src/shared/utils/config.util';

@Injectable()
export class MetricService {
  private tenantCountMap = new Map<string, MetricDto>();
  private redis: Redis;
  constructor() {
    this.redis = new Redis({
      host: REDIS_CONFIG.host,
      port: REDIS_CONFIG.port,
    });
  }

  async getTenantCounts(tenantId: string): Promise<MetricDto> {
    const data = await this.redis.get(tenantId);
    if (data) {
      return JSON.parse(data);
    }

    const leadCount = await getRepo(Lead, tenantId);
    const contactCount = await getRepo(Contact, tenantId);
    const dealCount = await getRepo(Deal, tenantId);
    const ticketCount = await getRepo(Ticket, tenantId);

    const counts: MetricDto = {
      leads: await leadCount.count(),
      contacts: await contactCount.count(),
      deals: await dealCount.count(),
      tickets: await ticketCount.count(),
    };
    this.redis.set(tenantId, JSON.stringify(counts), 'EX', 300);
    return counts;
  }
  async updateTenantCounts(tenantId: string, metrics: Partial<MetricDto>) {
    const metricData = this.tenantCountMap.get(tenantId);
    if (metricData) {
      for (const key in metrics) {
        const k = key as keyof MetricDto;
        if (metrics[k] !== undefined) {
          metricData[k] = metricData[k] + metrics[k];
        }
      }
      this.redis.set(tenantId, JSON.stringify(metricData), 'EX', 300);
      // await this.crmGateway.emitMetricUpdate(tenantId);
    }
  }
}
