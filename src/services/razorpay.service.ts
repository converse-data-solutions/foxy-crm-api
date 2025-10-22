import { HttpStatus, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoggerService } from 'src/common/logger/logger.service';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { RazorpayPayload } from 'src/interfaces/razorpay-payload.interface';
import { Repository } from 'typeorm';
import { SubscriptionHistoryService } from './subscription-history.service';
import { PlanPricing } from 'src/database/entities/base-app-entities/plan-pricing.entity';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class RazorpayService {
  constructor(
    private readonly logger: LoggerService,
    private readonly subscriptionHistoryService: SubscriptionHistoryService,
    @InjectRepository(Subscription) private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(PlanPricing) private readonly planPriceRepo: Repository<PlanPricing>,
    @InjectQueue('subscription-queue') private readonly subscriptionQueue: Queue,
  ) {}
  async handleWebhook(rawbody: string, signature: string) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawbody);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== signature) {
      this.logger.logError('Invalid webhook signature');
      return { status: 'invalid signature' };
    }

    const payload = JSON.parse(rawbody) as RazorpayPayload;
    this.logger.logSuccess('Valid webhook received: ' + payload.event);

    switch (payload.event) {
      case 'subscription.activated':
        await this.verifyPayment(payload);
        break;

      case 'subscription.completed':
        this.logger.logSuccess(
          'Subscription completed: ' + payload.payload.subscription?.entity.id,
        );
        break;
    }
    return { status: HttpStatus.OK };
  }

  async verifyPayment(payload: RazorpayPayload) {
    const email = payload.payload.payment?.entity.email;
    const razorpayPaymentId = payload.payload.payment?.entity.id;

    const razorpaySubscription = payload.payload.subscription?.entity;
    const razorpaySubscriptionId = razorpaySubscription?.id;
    const razorpayCustomerId = razorpaySubscription?.customer_id;
    const startDate = razorpaySubscription?.current_start
      ? new Date(razorpaySubscription.current_start * 1000)
      : undefined;
    const endDate = razorpaySubscription?.current_end
      ? new Date(razorpaySubscription.current_end * 1000)
      : undefined;
    const planId = razorpaySubscription?.plan_id;

    if (email && planId) {
      const subscription = await this.subscriptionRepo.findOne({
        where: { tenant: { email } },
        relations: { tenant: true, planPrice: true },
      });
      const planPrice = await this.planPriceRepo.findOne({
        where: { priceId: planId },
      });

      if (!subscription) {
        throw new UnprocessableEntityException('Invalid payment mail address');
      }
      subscription.status = true;
      const updatedSubscription = await this.subscriptionRepo.save({
        ...subscription,
        razorpayCustomerId,
        startDate,
        endDate,
        razorpayPaymentId,
        razorpaySubscriptionId,
        planPrice: planPrice ?? undefined,
      });
      await this.subscriptionHistoryService.createSubscriptionHistory(updatedSubscription);
      await this.subscriptionQueue.add('change-subscription-plan', updatedSubscription);
    } else {
      throw new UnprocessableEntityException('Invalid payment mail address');
    }
  }
}
