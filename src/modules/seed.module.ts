import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from 'src/database/entities/base-app-entities/plan.entity';
import { SeedService } from 'src/services/seed.service';
import { StripePaymentModule } from './stripe-payment.module';
import { PlanPricing } from 'src/database/entities/base-app-entities/plan-pricing.entity';
import { Tenant } from 'src/database/entities/base-app-entities/tenant.entity';
import { CountryService } from 'src/services/country.service';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { LoggerModule } from './logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Plan, PlanPricing, Tenant, Subscription]),
    StripePaymentModule,
    LoggerModule,
  ],
  providers: [SeedService, CountryService],
  exports: [SeedService],
})
export class SeedModule {}
