import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from 'src/database/entities/base-app-entities/plan.entity';
import { SeedService } from 'src/services/seed.service';
import { StripePaymentModule } from './stripe-payment.module';
import { PlanPricing } from 'src/database/entities/base-app-entities/plan-pricing.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Plan, PlanPricing]), StripePaymentModule],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
