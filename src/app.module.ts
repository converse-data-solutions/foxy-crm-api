import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth.module';
import { UserModule } from './modules/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSource } from './database/datasources/base-app-data-source';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { LeadModule } from './modules/lead.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ContactModule } from './modules/contact.module';
import { AccountModule } from './modules/account.module';
import { DealModule } from './modules/deal.module';
import { SubscriptionModule } from './modules/subscription.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { SeedModule } from './modules/seed.module';
import { TenantModule } from './modules/tenant.module';
import { TicketModule } from './modules/ticket.module';
import { TaskModule } from './modules/task.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OtpModule } from './modules/otp.module';
import { CountryModule } from './modules/country.module';
import { LoggerService } from './common/logger/logger.service';
import { LoggerInterceptor } from './interceptor/logger.interceptor';
import { GlobalAuthGuard } from './guards/global.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/role.guard';
import { Environment, REDIS_CONFIG, SMTP_CONFIG } from './shared/utils/config.util';
import { LeadActivityModule } from './modules/lead-activity.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CustomExceptionFilter } from './common/filter/custom-exception.filter';
import { LeadConversionModule } from './modules/lead-conversion.module';
import { StripePaymentModule } from './modules/stripe-payment.module';
import { TokenModule } from './modules/token.module';
import { StripePaymentController } from './controllers/stripe-payment.controller';
import { MetricModule } from './modules/metric.module';
import { EmailModule } from './modules/email.module';
import { SubscriptionHistoryModule } from './modules/subscription-history.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: Environment.NODE_ENV !== 'dev' ? '.env.docker' : '.env',
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    TypeOrmModule.forRootAsync({ useFactory: async () => dataSource.options }),
    BullModule.forRoot({
      connection: {
        host: REDIS_CONFIG.host,
        port: REDIS_CONFIG.port,
      },
      defaultJobOptions: { removeOnComplete: true },
    }),
    MailerModule.forRoot({
      transport: {
        host: SMTP_CONFIG.host,
        port: SMTP_CONFIG.port,
        secure: false,
        auth: {
          user: SMTP_CONFIG.user,
          pass: SMTP_CONFIG.pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
        logger: false,
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
      },
      defaults: {
        from: 'Converse Data Solutions',
      },
    }),
    AuthModule,
    SubscriptionModule,
    TenantModule,
    UserModule,
    LeadModule,
    LeadActivityModule,
    LeadConversionModule,
    ContactModule,
    AccountModule,
    DealModule,
    TicketModule,
    TaskModule,
    OtpModule,
    SeedModule,
    CountryModule,
    StripePaymentModule,
    TokenModule,
    MetricModule,
    EmailModule,
    SubscriptionHistoryModule,
    EventEmitterModule.forRoot(),
  ],
  providers: [
    JwtAuthGuard,
    RolesGuard,
    LoggerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },

    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    {
      provide: APP_GUARD,
      useClass: GlobalAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: CustomExceptionFilter,
    },
  ],
  exports: [LoggerService],
  controllers: [StripePaymentController],
})
export class AppModule {}
