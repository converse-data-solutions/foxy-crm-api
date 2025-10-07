import { forwardRef, Module } from '@nestjs/common';
import { SubscriptionService } from '../services/subscription.service';
import { SubscriptionController } from '../controllers/subscription.controller';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { Tenant } from 'src/database/entities/base-app-entities/tenant.entity';
import { Plan } from 'src/database/entities/base-app-entities/plan.entity';
import { SubscriptionScheduler } from 'src/schedulers/subscription.scheduler';
import { AuthModule } from './auth.module';
import { StripePaymentModule } from './stripe-payment.module';

@Module({
  imports: [
    JwtModule,
    TypeOrmModule.forFeature([Tenant, Subscription, Plan]),
    AuthModule,
    StripePaymentModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
