import { Module } from '@nestjs/common';
import { DealService } from '../service/deal.service';
import { DealController } from '../controller/deal.controller';
import { DealScheduler } from 'src/scheduler/deal.scheduler';
import { Subscription } from 'src/database/entity/base-app/subscription.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantSubscription } from 'src/database/entity/base-app/tenant-subscription.entity';
import { Tenant } from 'src/database/entity/base-app/tenant.entity';
import { Country } from 'src/database/entity/common-entity/country.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, TenantSubscription, Country, Subscription])],
  controllers: [DealController],
  providers: [DealService, DealScheduler],
})
export class DealModule {}
