import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth.module';
import { UserModule } from './modules/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSource } from './database/datasources/base-app-data-source';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LeadModule } from './modules/lead.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/role.guard';
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

@Module({
  imports: [
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
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false,
        auth: {
          user: process.env.CLIENT_MAIL,
          pass: process.env.CLIENT_SECRET_MAIL,
        },
        tls: {
          rejectUnauthorized: false,
        },
        logger: false,
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
