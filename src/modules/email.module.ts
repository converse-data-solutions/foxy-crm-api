import { Module } from '@nestjs/common';
import { EmailService } from '../services/email.service';
import { BullModule } from '@nestjs/bullmq';
import { EmailProcessor } from 'src/processors/email.processor';
import { SMTP_CONFIG } from 'src/shared/utils/config.util';
import { MailerModule } from '@nestjs-modules/mailer';
import { QueueModule } from './queue.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'mail-queue' }),
    QueueModule,
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
  ],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService],
})
export class EmailModule {}
