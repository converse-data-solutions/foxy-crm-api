import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Between, LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TenantSubscription } from 'src/database/entity/base-app/tenant-subscription.entity';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { Deal } from 'src/database/entity/core-app/deal.entity';
import { dealRemainderTemplate } from 'src/template/deal-remainder.template';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class DealScheduler {
  constructor(
    @InjectRepository(TenantSubscription)
    private readonly tenantSubscriptionRepo: Repository<TenantSubscription>,
    private readonly mailService: MailerService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkDealExpiration() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today

    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // start

    const tenants = await this.tenantSubscriptionRepo.find({
      select: { tenant: { schemaName: true } },
      where: { status: true, subscription: { planName: 'Platinum' } },
      relations: { subscription: true, tenant: true },
    });
    const schemas = tenants.map((tenant) => tenant.tenant.schemaName);

    for (const schema of schemas) {
      const dealRepo = await getRepo(Deal, schema);
      const deals = await dealRepo.find({
        where: {
          expectedCloseDate: Between(today, tomorrow),
        },
        relations: { createdBy: true },
      });

      for (const deal of deals) {
        const html = dealRemainderTemplate(deal.createdBy.name, deal.name, deal.expectedCloseDate!);
        await this.mailService.sendMail({
          to: deal.createdBy.email,
          html,
          subject: `Reminder: Deal "${deal.name}" Expected to Close Within 24 Hours`,
        });
      }
    }
  }
}
