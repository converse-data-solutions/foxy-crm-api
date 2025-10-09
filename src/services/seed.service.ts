import { Inject, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import * as fs from 'fs';
import { Repository } from 'typeorm';
import { BillingCycle } from '../enums/billing-cycle.enum';
import { PlanPricing } from 'src/database/entities/base-app-entities/plan-pricing.entity';
import { Plan } from 'src/database/entities/base-app-entities/plan.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { join } from 'path';
import { PlanInterface } from 'src/interfaces/plan.interface';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  private planDefinitions: PlanInterface[] = [];

  constructor(
    @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,
    @InjectRepository(Plan) private readonly planRepo: Repository<Plan>,
    @InjectRepository(PlanPricing) private readonly pricingRepo: Repository<PlanPricing>,
  ) {}

  async subscriptionSeed() {
    const filePath = join(__dirname, '../seed/subscription-mock-data.json');

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }
    const rawData = fs.readFileSync(filePath, 'utf-8');
    this.planDefinitions = JSON.parse(rawData);

    for (const planDef of this.planDefinitions) {
      const stripeProducts = await this.stripe.products.list({ limit: 100 });
      let stripeProduct = stripeProducts.data.find((p) => p.metadata?.planName === planDef.name);

      if (!stripeProduct) {
        stripeProduct = await this.stripe.products.create({
          name: planDef.name,
          description: `${planDef.name} Plan`,
          metadata: { planName: planDef.name },
        });
        this.logger.log(`Created Stripe product for plan: ${planDef.name}`);
      } else {
        this.logger.log(`Found existing Stripe product for plan: ${planDef.name}`);
      }
      let plan = await this.planRepo.findOne({ where: { planName: planDef.name } });
      if (!plan) {
        plan = this.planRepo.create({
          planName: planDef.name,
          stripeProductId: stripeProduct.id,
          userCount: planDef.userCount,
        });
        await this.planRepo.save(plan);
        this.logger.log(`Created DB plan: ${planDef.name}`);
      } else {
        if (!plan.stripeProductId || plan.stripeProductId !== stripeProduct.id) {
          plan.stripeProductId = stripeProduct.id;
          await this.planRepo.save(plan);
        }
        this.logger.log(`Found DB plan: ${planDef.name}`);
      }
      const existingPrices = await this.stripe.prices.list({
        product: stripeProduct.id,
        active: true,
      });

      for (const [cycle, amount] of Object.entries(planDef.prices)) {
        let interval: 'month' | 'year' = 'month';
        let interval_count = 1;

        switch (cycle.toLowerCase()) {
          case 'monthly':
            interval = 'month';
            interval_count = 1;
            break;
          case 'quarterly':
            interval = 'month';
            interval_count = 3;
            break;
          case 'halfyearly':
            interval = 'month';
            interval_count = 6;
            break;
          case 'yearly':
            interval = 'year';
            interval_count = 1;
            break;
        }

        let stripePrice = existingPrices.data.find(
          (p) =>
            p.recurring?.interval === interval &&
            p.recurring?.interval_count === interval_count &&
            p.metadata?.billingCycle === cycle,
        );

        if (!stripePrice) {
          stripePrice = await this.stripe.prices.create({
            unit_amount: amount * 100,
            currency: 'inr',
            recurring: { interval, interval_count },
            product: stripeProduct.id,
            metadata: { billingCycle: cycle },
          });
          this.logger.log(`Created Stripe price: ${planDef.name} - ${cycle}`);
        } else {
          this.logger.log(`Found existing Stripe price: ${planDef.name} - ${cycle}`);
        }

        let planPricing = await this.pricingRepo.findOne({
          where: { plan: { id: plan.id }, billingCycle: cycle as BillingCycle },
        });

        if (!planPricing) {
          planPricing = this.pricingRepo.create({
            plan,
            billingCycle: cycle as BillingCycle,
            price: amount,
            stripePriceId: stripePrice.id,
          });
          await this.pricingRepo.save(planPricing);
          this.logger.log(`Created DB PlanPricing: ${planDef.name} - ${cycle}`);
        } else {
          if (!planPricing.stripePriceId || planPricing.stripePriceId !== stripePrice.id) {
            planPricing.stripePriceId = stripePrice.id;
            await this.pricingRepo.save(planPricing);
          }
        }
      }
    }

    this.logger.log('Subscription plans seeded successfully!');
  }
}
