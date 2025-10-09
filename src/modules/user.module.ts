import { Module } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { UserController } from '../controllers/user.controller';
import { CountryModule } from './country.module';
import { TenantModule } from './tenant.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { PlanPricing } from 'src/database/entities/base-app-entities/plan-pricing.entity';
import { TaskModule } from './task.module';

@Module({
  imports: [
    CountryModule,
    TenantModule,
    TypeOrmModule.forFeature([Subscription, PlanPricing]),
    TaskModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
