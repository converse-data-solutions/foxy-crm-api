import { Processor, WorkerHost } from '@nestjs/bullmq';
import { forwardRef, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { SubscriptionService } from 'src/services/subscription.service';

@Processor('subscription-queue')
export class SubscriptionProcessor extends WorkerHost {
  constructor(
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
  ) {
    super();
  }
  async process(job: Job) {
    switch (job.name) {
      case 'expire-subscription':
        await this.subscriptionService.expireSubscription(job.data.id as string);
        break;
      case 'subscription-reminder-mail':
        await this.subscriptionService.subscriptionRemainder(job.data.subscriptionId as string);
        break;
      case 'change-subscription-plan':
        await this.subscriptionService.changeSubscriptionPlans(job.data as Subscription);
        break;
    }
  }
}
