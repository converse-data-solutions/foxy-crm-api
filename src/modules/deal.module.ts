import { Module } from '@nestjs/common';
import { DealService } from '../services/deal.service';
import { DealController } from '../controllers/deal.controller';
import { DealScheduler } from 'src/schedulers/deal.scheduler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from 'src/database/entities/base-app-entities';
import { MetricModule } from './metric.module';
import { EmailModule } from './email.module';
import { SubscriptionModule } from './subscription.module';
import { TenantThrottlerGuard } from 'src/guards/tenant-throttler.guard';

@Module({
  imports: [TypeOrmModule.forFeature(entities), MetricModule, EmailModule, SubscriptionModule],
  controllers: [DealController],
  providers: [DealService, DealScheduler, TenantThrottlerGuard],
})
export class DealModule {}
