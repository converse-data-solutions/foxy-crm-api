import { Inject, Injectable, Logger } from '@nestjs/common';
import Razorpay from 'razorpay';
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
    @Inject('RAZORPAY_CLIENT') private readonly razorpay: Razorpay,
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
      // 1️⃣ Check if plan exists in DB
      let plan = await this.planRepo.findOne({ where: { planName: planDef.name } });

      if (!plan) {
        plan = this.planRepo.create({
          planName: planDef.name,
          userCount: planDef.userCount,
        });
        await this.planRepo.save(plan);
        this.logger.log(`Created DB plan: ${planDef.name}`);
      } else {
        this.logger.log(`Found DB plan: ${planDef.name}`);
      }

      // 2️⃣ Create Razorpay plans for each billing cycle
      for (const [cycle, amount] of Object.entries(planDef.prices)) {
        let interval: 'monthly' | 'yearly' = 'monthly';
        let intervalCount = 1;

        switch (cycle.toLowerCase()) {
          case 'monthly':
            interval = 'monthly';
            intervalCount = 1;
            break;
          case 'quarterly':
            interval = 'monthly';
            intervalCount = 3;
            break;
          case 'halfyearly':
            interval = 'monthly';
            intervalCount = 6;
            break;
          case 'yearly':
            interval = 'yearly';
            intervalCount = 1;
            break;
        }

        // Check if plan pricing exists in DB
        let planPricing = await this.pricingRepo.findOne({
          where: { plan: { id: plan.id }, billingCycle: cycle as BillingCycle },
        });

        if (!planPricing) {
          // Create Razorpay plan
          const razorpayPlan = await this.razorpay.plans.create({
            period: interval,
            interval: intervalCount,
            item: {
              name: `${planDef.name} - ${cycle}`,
              amount: amount * 100, // paise
              currency: 'INR',
              description: `${planDef.name} ${cycle} subscription`,
            },
          });

          planPricing = this.pricingRepo.create({
            plan,
            billingCycle: cycle as BillingCycle,
            price: amount,
            // razorpayPlanId: razorpayPlan.id,
            priceId: razorpayPlan.id,
          });
          await this.pricingRepo.save(planPricing);

          this.logger.log(`Created Razorpay plan & DB PlanPricing: ${planDef.name} - ${cycle}`);
        } else {
          this.logger.log(`Found DB PlanPricing: ${planDef.name} - ${cycle}`);
        }
      }
    }

    this.logger.log('Razorpay subscription plans seeded successfully!');
  }
}
