import { Module } from '@nestjs/common';
import { TicketService } from '../services/ticket.service';
import { TicketController } from '../controllers/ticket.controller';
import { MetricModule } from './metric.module';

@Module({
  imports: [MetricModule],
  controllers: [TicketController],
  providers: [TicketService],
})
export class TicketModule {}
