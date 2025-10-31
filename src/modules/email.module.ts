import { Module } from '@nestjs/common';
import { EmailService } from '../services/email.service';
import { BullModule } from '@nestjs/bullmq';
import { EmailProcessor } from 'src/processors/email.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'mail-queue' })],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService],
})
export class EmailModule {}
