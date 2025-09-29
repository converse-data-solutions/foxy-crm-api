import { Module } from '@nestjs/common';
import { TicketService } from '../services/ticket.service';
import { TicketController } from '../controllers/ticket.controller';

@Module({
  controllers: [TicketController],
  providers: [TicketService],
})
export class TicketModule {}
