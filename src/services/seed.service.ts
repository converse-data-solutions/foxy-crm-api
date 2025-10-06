import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { join } from 'path';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SubscriptionInterface } from 'src/interfaces/subscription.interface';
import { Plan } from 'src/database/entities/base-app-entities/plan.entity';

@Injectable()
export class SeedService {
  private subscriptions: SubscriptionInterface[] = [];
  constructor(@InjectRepository(Plan) private readonly planRepo: Repository<Plan>) {}

  async subscriptionSeed() {
    const filePath = join(__dirname, '../seed/subscription-mock-data.json');
    console.log(filePath);

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
