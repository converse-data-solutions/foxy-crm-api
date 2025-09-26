import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { User } from 'src/database/entity/core-app/user.entity';
import { LeadService } from 'src/service/lead.service';

@Processor('file-import')
export class FileProcessor extends WorkerHost {
  constructor(private readonly leadService: LeadService) {
    super();
  }
  async process(job: Job) {
    const { file, tenant, user } = job.data;
    await this.leadService.bulkLeadsSave(file, tenant, user);
  }
}
