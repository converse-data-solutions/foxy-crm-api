import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Between, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription } from 'src/database/entity/base-app/subscription.entity';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class SubscriptionScheduler {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectQueue('subscription') private readonly subscriptionQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async expireSubscriptions() {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const subscriptions = await this.subscriptionRepo.find({
      where: {
        status: true,
        endDate: Between(now, tomorrow),
      },
    });
    for (const sub of subscriptions) {
      if (sub.endDate) {
        const delay = sub.endDate.getTime() - now.getTime();
        await this.subscriptionQueue.add('expire-subscription', { id: sub.id }, { delay });
        await this.subscriptionQueue.add('subscription-reminder-mail', { subscriptionId: sub.id });
      }
    }
  }
}
