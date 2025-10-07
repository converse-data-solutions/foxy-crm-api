import { Module } from '@nestjs/common';
import { LeadConversionService } from '../services/lead-conversion.service';
import { CountryModule } from './country.module';

@Module({
  imports: [CountryModule],
  providers: [LeadConversionService],
  exports: [LeadConversionService],
})
export class LeadConversionModule {}
