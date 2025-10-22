import { Module } from '@nestjs/common';
import { RazorpayService } from '../services/razorpay.service';
import { RazorpayController } from 'src/controllers/razorpay.controller';
import Razorpay from 'razorpay';
import { RAZORPAY } from 'src/shared/utils/config.util';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from 'src/database/entities/base-app-entities';
import { LoggerModule } from './logger.module';
import { SubscriptionHistoryModule } from './subscription-history.module';
import { BullModule } from '@nestjs/bullmq';
import { SubscriptionProcessor } from 'src/processors/subscription.processor';
import { SubscriptionScheduler } from 'src/schedulers/subscription.scheduler';

@Module({
  imports: [
    TypeOrmModule.forFeature(entities),
    LoggerModule,
    SubscriptionHistoryModule,
    BullModule.registerQueue({ name: 'subscription-queue' }),
  ],
  controllers: [RazorpayController],
  providers: [
    RazorpayService,
    SubscriptionProcessor,
    SubscriptionScheduler,
    {
      provide: 'RAZORPAY_CLIENT',
      useFactory: () => {
        return new Razorpay({
          key_id: RAZORPAY.razorPayKeyID,
          key_secret: RAZORPAY.razorPaySecreteID,
        });
      },
    },
  ],
  exports: [RazorpayService, 'RAZORPAY_CLIENT'],
})
export class RazorpayModule {}
