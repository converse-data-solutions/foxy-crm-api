import { Module } from '@nestjs/common';
import { TenantService } from '../service/tenant.service';
import { SeedModule } from './seed.module';
import { TenantProcessor } from 'src/processor/tenant-processor';

@Module({
  imports: [SeedModule],
  providers: [TenantService, TenantProcessor],
  exports: [TenantService, TenantProcessor],
})
export class TenantModule {}
