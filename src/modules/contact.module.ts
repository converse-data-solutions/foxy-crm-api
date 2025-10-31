import { Module } from '@nestjs/common';
import { ContactService } from '../services/contact.service';
import { ContactController } from '../controllers/contact.controller';
import { MetricModule } from './metric.module';

@Module({
  imports: [MetricModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
