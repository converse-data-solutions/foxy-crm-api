// stripe.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StripeController } from 'src/controller/stripe.controller';
import { StripeService } from 'src/service/stripe.service';
import Stripe from 'stripe';

@Module({
  imports: [ConfigModule],
  controllers: [StripeController],
  providers: [
    {
      provide: 'STRIPE_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new Stripe(config.get<string>('STRIPE_SECRET_KEY')!, {
          apiVersion: '2025-08-27.basil',
        });
      },
    },
    StripeService,
  ],
  exports: [StripeService],
})
export class StripeModule {}
