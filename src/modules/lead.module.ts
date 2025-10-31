import { Module } from '@nestjs/common';
import { LeadService } from '../services/lead.service';
import { LeadController } from '../controllers/lead.controller';
import { BullModule } from '@nestjs/bullmq';
import { FileProcessor } from 'src/processors/file.processor';
import { LeadConversionModule } from './lead-conversion.module';
import { MetricModule } from './metric.module';
import { EmailModule } from './email.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'file-import' }),
    LeadConversionModule,
    MetricModule,
    EmailModule,
  ],
  controllers: [LeadController],
  providers: [LeadService, FileProcessor],
})
export class LeadModule {}
