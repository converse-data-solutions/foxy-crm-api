import { forwardRef, Module } from '@nestjs/common';
import { SubscriptionService } from '../services/subscription.service';
import { SubscriptionController } from '../controllers/subscription.controller';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth.module';
import { StripePaymentModule } from './stripe-payment.module';
import { entities } from 'src/database/entities/base-app-entities';

@Module({
  imports: [
    JwtModule,
    TypeOrmModule.forFeature(entities),
    forwardRef(() => AuthModule),
    forwardRef(() => StripePaymentModule),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
