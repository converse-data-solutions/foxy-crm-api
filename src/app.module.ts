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
import { SubscriptionModule } from './module/subscription.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { SeedModule } from './module/seed.module';
import { TenantModule } from './module/tenant.module';
import { TicketModule } from './module/ticket.module';
import { TaskModule } from './module/task.module';

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
