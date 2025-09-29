import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SubscriptionService } from 'src/services/subscription.service';

@Processor('subscription')
export class SubscriptionProcessor extends WorkerHost {
  constructor(private readonly subscriptionService: SubscriptionService) {
    super();
  }
  async process(job: Job) {
    switch (job.name) {
      case 'expire-subscription':
        await this.subscriptionService.expireSubscription(job.data.id as string);
        break;
      case 'subscription-reminder-mail':
        await this.subscriptionService.subscriptionRemainder(job.data.id as string);
        break;
    }
  }
}
