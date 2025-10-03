import { Module } from '@nestjs/common';
import { DealService } from '../services/deal.service';
import { DealController } from '../controllers/deal.controller';
import { DealScheduler } from 'src/schedulers/deal.scheduler';
import { Plan } from 'src/database/entities/base-app-entities/plan.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { Tenant } from 'src/database/entities/base-app-entities/tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, Subscription, Plan])],
  controllers: [DealController],
  providers: [DealService, DealScheduler],
})
export class DealModule {}
