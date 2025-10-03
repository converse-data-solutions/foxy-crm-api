import { Injectable, NotFoundException } from '@nestjs/common';
import { countries, ICountry } from 'countries-list';
@Injectable()
export class CountryService {
  getCountry(name: string) {
    const isoCode = Object.keys(countries).find(
      (code) => countries[code].name.toLowerCase() === name.toLowerCase(),
    );
    if (!isoCode) {
<<<<<<< HEAD
      throw new NotFoundException('Country not found or invalid country');
=======
      throw new NotFoundException({ message: 'Country not found or invalid country' });
>>>>>>> da3c435 (reset-password)
    }
    const data: ICountry = countries[isoCode];
    return data.name;
  }
}
