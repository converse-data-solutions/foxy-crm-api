import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SubscriptionHistory } from 'src/database/entities/base-app-entities/subscription-history.entity';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SubscriptionHistoryService {
  constructor(
    @InjectRepository(SubscriptionHistory)
    private readonly subscriptionHistoryRepo: Repository<SubscriptionHistory>,
  ) {}
  async createSubscriptionHistory(subscription: Subscription) {
    const { id, ...subscriptionDetails } = subscription;
    const updateHistories: SubscriptionHistory[] = [];
    const existingSubscription = await this.subscriptionHistoryRepo.findOne({
      where: { tenant: { id: subscription.tenant.id }, status: true },
    });
    if (existingSubscription) {
      existingSubscription.status = false;
      updateHistories.push(existingSubscription);
    }
    const subscriptionHistory = this.subscriptionHistoryRepo.create({
      ...subscriptionDetails,
      amount: subscription.planPrice.price,
      createdAt: new Date(),
      tenant: subscription.tenant,
    });
    updateHistories.push(subscriptionHistory);
    await this.subscriptionHistoryRepo.save(updateHistories);
  }
}
