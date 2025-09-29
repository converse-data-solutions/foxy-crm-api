import { Module } from '@nestjs/common';
import { TenantService } from '../services/tenant.service';
import { SeedModule } from './seed.module';
import { TenantProcessor } from 'src/processors/tenant-processor';

@Module({
  imports: [SeedModule],
  providers: [TenantService, TenantProcessor],
  exports: [TenantService, TenantProcessor],
})
export class TenantModule {}
