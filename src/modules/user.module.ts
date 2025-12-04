import { Module } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { UserController } from '../controllers/user.controller';
import { CountryModule } from './country.module';
import { TenantModule } from './tenant.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { PlanPricing } from 'src/database/entities/base-app-entities/plan-pricing.entity';
import { TaskModule } from './task.module';
import { TokenModule } from './token.module';
import { SubscriptionModule } from './subscription.module';
import { TenantThrottlerGuard } from 'src/guards/tenant-throttler.guard';
import { AuditLogModule } from './audit-log.module';

@Module({
  imports: [
    CountryModule,
    TenantModule,
    SubscriptionModule,
    TypeOrmModule.forFeature([Subscription, PlanPricing]),
    TaskModule,
    TokenModule,
    AuditLogModule,
  ],
  controllers: [UserController],
  providers: [UserService, TenantThrottlerGuard],
  exports: [UserService],
})
export class UserModule {}
