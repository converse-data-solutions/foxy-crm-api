import { Module } from '@nestjs/common';
import { ContactService } from '../services/contact.service';
import { ContactController } from '../controllers/contact.controller';
import { MetricModule } from './metric.module';
import { SubscriptionModule } from './subscription.module';
import { TenantThrottlerGuard } from 'src/guards/tenant-throttler.guard';

@Module({
  imports: [MetricModule, SubscriptionModule],
  controllers: [ContactController],
  providers: [ContactService, TenantThrottlerGuard],
})
export class ContactModule {}
