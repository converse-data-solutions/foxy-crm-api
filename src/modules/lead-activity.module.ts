import { Module } from '@nestjs/common';
import { LeadActivityController } from 'src/controllers/lead-activity.controller';
import { LeadActivityService } from 'src/services/lead-activity.service';

@Module({
  controllers: [LeadActivityController],
  providers: [LeadActivityService],
})
export class LeadActivityModule {}
