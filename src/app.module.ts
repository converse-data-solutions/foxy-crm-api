import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth.module';
import { UserModule } from './modules/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSource } from './database/datasources/base-app-data-source';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { LeadModule } from './modules/lead.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
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
import { JWT_CONFIG, REDIS_CONFIG, SMTP_CONFIG } from './common/constant/config.constants';
import { LeadActivityModule } from './modules/lead-activity.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({ useFactory: async () => dataSource.options }),
    BullModule.forRoot({
      connection: {
        host: REDIS_CONFIG.host,
        port: REDIS_CONFIG.port,
      },
      defaultJobOptions: { removeOnComplete: true },
    }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: JWT_CONFIG.SECRET_KEY,
        signOptions: { expiresIn: JWT_CONFIG.EXPIRES_IN },
      }),
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
    EventEmitterModule.forRoot(),
    AuthModule,
    UserModule,
    LeadModule,
    ContactModule,
    AccountModule,
    DealModule,
    SubscriptionModule,
    SeedModule,
    TenantModule,
    TicketModule,
    TaskModule,
    OtpModule,
    CountryModule,
    LeadActivityModule,
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
      useClass: GlobalAuthGuard,
    },
  ],
})
export class AppModule {}
