import { Module } from '@nestjs/common';
import { LeadService } from '../service/lead.service';
import { LeadController } from '../controller/lead.controller';
import { BullModule } from '@nestjs/bullmq';
import { FileWorker } from 'src/worker/file-worker';

@Module({
  imports: [BullModule.registerQueue({ name: 'file-import' })],
  controllers: [LeadController],
  providers: [LeadService, FileWorker],
})
export class LeadModule {}
