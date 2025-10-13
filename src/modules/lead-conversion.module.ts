import { Module } from '@nestjs/common';
import { LeadConversionService } from '../services/lead-conversion.service';
import { CountryModule } from './country.module';
import { MetricModule } from './metric.module';

@Module({
  imports: [CountryModule, MetricModule],
  providers: [LeadConversionService],
  exports: [LeadConversionService],
})
export class LeadConversionModule {}
