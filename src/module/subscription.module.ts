import { Module } from '@nestjs/common';
import { SubscriptionService } from '../service/subscription.service';
import { SubscriptionController } from '../controller/subscription.controller';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantSubscription } from 'src/database/entity/base-app/tenant-subscription.entity';
import { Tenant } from 'src/database/entity/base-app/tenant.entity';
import { Country } from 'src/database/entity/common-entity/country.entity';
import { Subscription } from 'src/database/entity/base-app/subscription.entity';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Module({
  imports: [
    JwtModule,
    TypeOrmModule.forFeature([Tenant, TenantSubscription, Country, Subscription]),
  ],
  controllers: [SubscriptionController],
  providers: [
    SubscriptionService,
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
