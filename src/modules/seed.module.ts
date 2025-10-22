import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from 'src/database/entities/base-app-entities/plan.entity';
import { SeedService } from 'src/services/seed.service';
import { PlanPricing } from 'src/database/entities/base-app-entities/plan-pricing.entity';
import { RazorpayModule } from './razorpay.module';

@Module({
  imports: [TypeOrmModule.forFeature([Plan, PlanPricing]), RazorpayModule],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
