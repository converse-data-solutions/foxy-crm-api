import { Module } from '@nestjs/common';
import { TicketService } from '../services/ticket.service';
import { TicketController } from '../controllers/ticket.controller';
import { MetricModule } from './metric.module';
import { SubscriptionModule } from './subscription.module';
import { TenantThrottlerGuard } from 'src/guards/tenant-throttler.guard';

@Module({
  imports: [MetricModule, SubscriptionModule],
  controllers: [TicketController],
  providers: [TicketService, TenantThrottlerGuard],
})
export class TicketModule {}
