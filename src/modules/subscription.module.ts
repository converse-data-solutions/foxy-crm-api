import { Module } from '@nestjs/common';
import { SubscriptionService } from '../services/subscription.service';
import { SubscriptionController } from '../controllers/subscription.controller';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { Tenant } from 'src/database/entities/base-app-entities/tenant.entity';
import { Plan } from 'src/database/entities/base-app-entities/plan.entity';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SubscriptionScheduler } from 'src/schedulers/subscription.scheduler';
import { BullModule } from '@nestjs/bullmq';
import { SubscriptionProcessor } from 'src/processors/subscription.processor';

@Module({
  imports: [
    JwtModule,
    TypeOrmModule.forFeature([Tenant, Subscription, Plan]),
    BullModule.registerQueue({ name: 'subscription' }),
  ],
  controllers: [SubscriptionController],
  providers: [
    SubscriptionService,
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
})
export class SubscriptionModule {}
