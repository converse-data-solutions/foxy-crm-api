import { forwardRef, Module } from '@nestjs/common';
import { StripePaymentService } from 'src/services/stripe-payment.service';
import { AuthModule } from './auth.module';
import Stripe from 'stripe';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { SubscriptionProcessor } from 'src/processors/subscription.processor';
import { SubscriptionModule } from './subscription.module';
import { SubscriptionScheduler } from 'src/schedulers/subscription.scheduler';
import { STRIPE } from 'src/shared/utils/config.util';
import { StripePaymentController } from 'src/controllers/stripe-payment.controller';
import { EmailModule } from './email.module';
import { SubscriptionHistoryModule } from './subscription-history.module';
import { PlanPricing } from 'src/database/entities/base-app-entities/plan-pricing.entity';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([Subscription, PlanPricing]),
    BullModule.registerQueue({ name: 'subscription-queue' }),
    EmailModule,
    forwardRef(() => SubscriptionModule),
    SubscriptionHistoryModule,
  ],
  controllers: [StripePaymentController],
  providers: [
    StripePaymentService,
    SubscriptionProcessor,
    SubscriptionScheduler,
    {
      provide: 'STRIPE_CLIENT',
      useFactory: () => {
        return new Stripe(STRIPE.stripeSecreteKey, {
          apiVersion: '2025-08-27.basil',
        });
      },
    },
  ],
  exports: [StripePaymentService, SubscriptionProcessor, 'STRIPE_CLIENT'],
})
export class StripePaymentModule {}
