import { Module } from '@nestjs/common';
import { DealService } from '../services/deal.service';
import { DealController } from '../controllers/deal.controller';
import { DealScheduler } from 'src/schedulers/deal.scheduler';
import { Plan } from 'src/database/entity/base-app/plan.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from 'src/database/entity/base-app/subscription.entity';
import { Tenant } from 'src/database/entity/base-app/tenant.entity';
import { Country } from 'src/database/entity/common-entity/country.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, Subscription, Country, Plan])],
  controllers: [DealController],
  providers: [DealService, DealScheduler],
})
export class DealModule {}
