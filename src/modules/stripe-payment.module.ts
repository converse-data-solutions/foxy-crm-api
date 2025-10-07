import { forwardRef, Module } from '@nestjs/common';
import { StripePaymentService } from 'src/services/stripe-payment.service';
import { AuthModule } from './auth.module';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { SubscriptionProcessor } from 'src/processors/subscription.processor';
import { SubscriptionModule } from './subscription.module';
import { SubscriptionScheduler } from 'src/schedulers/subscription.scheduler';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Subscription]),
    BullModule.registerQueue({ name: 'subscription' }),
    forwardRef(() => SubscriptionModule),
  ],
  providers: [
    StripePaymentService,
    SubscriptionProcessor,
    SubscriptionScheduler,
    {
      provide: 'STRIPE_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new Stripe(config.get<string>('STRIPE_SECRET_KEY')!, {
          apiVersion: '2025-08-27.basil',
        });
      },
    },
  ],
  exports: [StripePaymentService, SubscriptionProcessor],
})
export class StripePaymentModule {}
