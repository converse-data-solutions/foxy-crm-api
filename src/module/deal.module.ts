import { Module } from '@nestjs/common';
import { DealService } from '../service/deal.service';
import { DealController } from '../controller/deal.controller';

@Module({
  controllers: [DealController],
  providers: [DealService],
})
export class DealModule {}
