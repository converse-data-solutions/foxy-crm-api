import { Module } from '@nestjs/common';
import { TicketService } from '../service/ticket.service';
import { TicketController } from '../controller/ticket.controller';

@Module({
  controllers: [TicketController],
  providers: [TicketService],
})
export class TicketModule {}
