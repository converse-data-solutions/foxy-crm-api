import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { join } from 'path';
import { CountryInterface } from 'src/interface/country.interface';
import { Repository } from 'typeorm';
import { Country } from 'src/database/entity/common-entity/country.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SeedService {
  private countries: CountryInterface[] = [];
  constructor(@InjectRepository(Country) private readonly countryRepo: Repository<Country>) {}

  async countrySeed() {
    const filePath = join(process.cwd(), 'src/asset/country-mock-data.json');
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }
    const rawData = fs.readFileSync(filePath, 'utf-8');
    this.countries = JSON.parse(rawData);

    const existingCountries = await this.countryRepo.find();
    if (existingCountries.length == 0) {
      for (const country of this.countries) {
        const newcCountries = this.countryRepo.create({
          name: country.name,
          isoCode2: country.iso_code_2,
          isoCode3: country.iso_code_3,
          phoneCode: country.phone_code,
          flagImage: country.country_flag,
          isActive: country.is_active ?? true,
        });
        await this.countryRepo.save(newcCountries);
      }
      console.log(`Seeded/updated ${this.countries.length} countries`);
    }
  }
}
