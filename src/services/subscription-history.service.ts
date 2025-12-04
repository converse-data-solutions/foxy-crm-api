import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SubscriptionHistory } from 'src/database/entities/base-app-entities/subscription-history.entity';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { Repository } from 'typeorm';
import { AuditLogService } from './audit-log.service';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { Action } from 'src/enums/action.enum';
import { AuditLogDto } from 'src/dtos/log-dto/audit-log.dto';

@Injectable()
export class SubscriptionHistoryService {
  constructor(
    @InjectRepository(SubscriptionHistory)
    private readonly subscriptionHistoryRepo: Repository<SubscriptionHistory>,
    private readonly auditLogService: AuditLogService,
  ) {}
  async createSubscriptionHistory(subscription: Subscription) {
    const { id, ...subscriptionDetails } = subscription;
    const updateHistories: SubscriptionHistory[] = [];
    const existingSubscription = await this.subscriptionHistoryRepo.findOne({
      where: { tenant: { id: subscription.tenant.id } },
      order: { startDate: 'DESC' },
    });
    if (existingSubscription && existingSubscription.status === true) {
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

    const tenantId = subscription.tenant.schemaName;
    const userRepo = await getRepo(User, tenantId);
    const user = await userRepo.findOne({ where: { email: subscription.tenant.email } });
    let action = Action.SubscriptionRenewed;

    if (!existingSubscription) action = Action.Subscribed;
    else if (existingSubscription.amount > subscription.planPrice.price)
      action = Action.SubscriptionDowngraded;
    else if (existingSubscription.amount < subscription.planPrice.price)
      action = Action.SubscriptionUpgraded;
    const logData: AuditLogDto = { action, tenantId, userId: user?.id };
    await this.auditLogService.createLog(logData);
  }
}
