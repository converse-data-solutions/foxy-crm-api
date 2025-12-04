import { Module } from '@nestjs/common';
import { LeadActivityController } from 'src/controllers/lead-activity.controller';
import { LeadActivityService } from 'src/services/lead-activity.service';
import { SubscriptionModule } from './subscription.module';
import { TenantThrottlerGuard } from 'src/guards/tenant-throttler.guard';

@Module({
  imports: [SubscriptionModule],
  controllers: [LeadActivityController],
  providers: [LeadActivityService, TenantThrottlerGuard],
})
export class LeadActivityModule {}
