import { Module } from '@nestjs/common';
import { LeadService } from '../services/lead.service';
import { LeadController } from '../controllers/lead.controller';
import { BullModule } from '@nestjs/bullmq';
import { FileProcessor } from 'src/processors/file-processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'file-import' })],
  controllers: [LeadController],
  providers: [LeadService, FileProcessor],
})
export class LeadModule {}
