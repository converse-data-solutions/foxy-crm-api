import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TenantService } from 'src/services/tenant.service';

@Processor('tenant-setup')
export class TenantProcessor extends WorkerHost {
  constructor(private tenantService: TenantService) {
    super();
  }
  async process(job: Job) {
    await this.tenantService.tenantSetup(job.data);
  }
}
