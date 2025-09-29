import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { join } from 'path';
import { CountryInterface } from 'src/interfaces/country.interface';
import { Repository } from 'typeorm';
import { Country } from 'src/database/entity/common-entity/country.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SubscriptionInterface } from 'src/interfaces/subscription.interface';
import { Plan } from 'src/database/entity/base-app/plan.entity';
import { getRepo } from 'src/shared/database-connection/get-connection';

@Injectable()
export class SeedService {
  private countries: CountryInterface[] = [];
  private subscriptions: SubscriptionInterface[] = [];
  constructor(
    @InjectRepository(Country) private readonly countryRepo: Repository<Country>,
    @InjectRepository(Plan) private readonly planRepo: Repository<Plan>,
  ) {}

  async countrySeed(schema?: string) {
    let countryRepository: Repository<Country>;
    if (schema) {
      countryRepository = await getRepo<Country>(Country, schema);
    } else {
      countryRepository = this.countryRepo;
    }
    const filePath = join(process.cwd(), 'src/asset/country-mock-data.json');
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }
    const rawData = fs.readFileSync(filePath, 'utf-8');
    this.countries = JSON.parse(rawData);

    const existingCountries = await countryRepository.find();
    if (existingCountries.length == 0) {
      for (const country of this.countries) {
        const newCountries = countryRepository.create({
          name: country.name,
          isoCode2: country.iso_code_2,
          isoCode3: country.iso_code_3,
          phoneCode: country.phone_code,
          flagImage: country.country_flag,
          isActive: country.is_active ?? true,
        });
        await countryRepository.save(newCountries);
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

    const existingSubscriptions = await this.planRepo.find();
    if (existingSubscriptions.length == 0) {
      for (const subscription of this.subscriptions) {
        const newSubscriptions = this.planRepo.create({
          ...subscription,
        });
        await this.planRepo.save(newSubscriptions);
      }
    }
  }
}
