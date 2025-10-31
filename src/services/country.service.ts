import { Injectable, NotFoundException } from '@nestjs/common';
import { countries, ICountry } from 'countries-list';
@Injectable()
export class CountryService {
  getCountry(name: string) {
    const isoCode = Object.keys(countries).find(
      (code) => countries[code].name.toLowerCase() === name.toLowerCase(),
    );
    if (!isoCode) {
      throw new NotFoundException('Country not found or invalid country');
    }
    const data: ICountry = countries[isoCode];
    return data.name;
  }
}
