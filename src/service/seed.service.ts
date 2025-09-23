import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { join } from 'path';
import { CountryInterface } from 'src/interface/country.interface';
import { Repository } from 'typeorm';
import { Country } from 'src/database/entity/common-entity/country.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SubscriptionInterface } from 'src/interface/subscription.interface';
import { Subscription } from 'src/database/entity/base-app/subscription.entity';

@Injectable()
export class SeedService {
  private countries: CountryInterface[] = [];
  private subscriptions: SubscriptionInterface[] = [];
  constructor(
    @InjectRepository(Country) private readonly countryRepo: Repository<Country>,
    @InjectRepository(Subscription) private readonly subscriptionRepo: Repository<Subscription>,
  ) {}

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
        const newCountries = this.countryRepo.create({
          name: country.name,
          isoCode2: country.iso_code_2,
          isoCode3: country.iso_code_3,
          phoneCode: country.phone_code,
          flagImage: country.country_flag,
          isActive: country.is_active ?? true,
        });
        await this.countryRepo.save(newCountries);
      }
    }
  }

  async subscriptionSeed() {
    const filePath = join(process.cwd(), 'src/asset/subscription-mock-data.json');
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }
    const rawData = fs.readFileSync(filePath, 'utf-8');
    this.subscriptions = JSON.parse(rawData);

    const existingSubscriptions = await this.subscriptionRepo.find();
    if (existingSubscriptions.length == 0) {
      for (const subscription of this.subscriptions) {
        const newSubscriptions = this.subscriptionRepo.create({
          ...subscription,
        });
        await this.subscriptionRepo.save(newSubscriptions);
      }
    }
  }
}
