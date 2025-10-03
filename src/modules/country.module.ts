import { Module } from '@nestjs/common';
import { CountryService } from '../services/country.service';

@Module({
  providers: [CountryService],
  exports: [CountryService],
})
export class CountryModule {}
