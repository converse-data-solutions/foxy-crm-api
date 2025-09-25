import { Module } from '@nestjs/common';
import { LeadService } from '../service/lead.service';
import { LeadController } from '../controller/lead.controller';
import { BullModule } from '@nestjs/bullmq';
import { FileProcessor } from 'src/processor/file-processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'file-import' })],
  controllers: [LeadController],
  providers: [LeadService, FileProcessor],
})
export class LeadModule {}
