import { forwardRef, Module } from '@nestjs/common';
import { SubscriptionService } from '../services/subscription.service';
import { SubscriptionController } from '../controllers/subscription.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth.module';
import { entities } from 'src/database/entities/base-app-entities';
import { TokenModule } from './token.module';
import { EmailModule } from './email.module';
import { TenantModule } from './tenant.module';
import { StripePaymentModule } from './stripe-payment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature(entities),
    EmailModule,
    forwardRef(() => StripePaymentModule),
    forwardRef(() => AuthModule),
    TokenModule,
    forwardRef(() => TenantModule),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
