import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Between, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { Deal } from 'src/database/entities/core-app-entities/deal.entity';
import { dealRemainderTemplate } from 'src/templates/deal-remainder.template';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class DealScheduler {
  constructor(
    @InjectRepository(Subscription)
    private readonly tenantSubscriptionRepo: Repository<Subscription>,
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
      where: { status: true, plan: { planName: 'Platinum' } },
      relations: { plan: true, tenant: true },
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
