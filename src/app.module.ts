import { Module } from '@nestjs/common';
import { AuthModule } from './module/auth.module';
import { UserModule } from './module/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSource } from './database/datasource/base-app-data-source';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LeadModule } from './module/lead.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { RolesGuard } from './guard/role.guard';
import { ContactModule } from './module/contact.module';
import { AccountModule } from './module/account.module';
import { DealModule } from './module/deal.module';
import { StripeModule } from './module/stripe.module';
import { SubscriptionModule } from './module/subscription.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env ' }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({ useFactory: async () => dataSource.options }),
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
      defaultJobOptions: { removeOnComplete: true },
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('SECRET_KEY'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') },
      }),
    }),
    LeadModule,
    ContactModule,
    AccountModule,
    DealModule,
    StripeModule,
    SubscriptionModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
