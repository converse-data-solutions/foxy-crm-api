import { Module } from '@nestjs/common';
import { DealService } from '../services/deal.service';
import { DealController } from '../controllers/deal.controller';
import { DealScheduler } from 'src/schedulers/deal.scheduler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from 'src/database/entities/base-app-entities';
import { MetricModule } from './metric.module';

@Module({
  imports: [TypeOrmModule.forFeature(entities), MetricModule],
  controllers: [DealController],
  providers: [DealService, DealScheduler],
})
export class DealModule {}
