import { forwardRef, Module } from '@nestjs/common';
import { SubscriptionService } from '../services/subscription.service';
import { SubscriptionController } from '../controllers/subscription.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth.module';
import { entities } from 'src/database/entities/base-app-entities';
import { TokenModule } from './token.module';
import { EmailModule } from './email.module';
import { RazorpayModule } from './razorpay.module';

@Module({
  imports: [
    TypeOrmModule.forFeature(entities),
    EmailModule,
    forwardRef(() => AuthModule),
    TokenModule,
    forwardRef(() => RazorpayModule),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
