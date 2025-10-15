import { PlanPricing } from './plan-pricing.entity';
import { Plan } from './plan.entity';
import { SubscriptionHistory } from './subscription-history.entity';
import { Subscription } from './subscription.entity';
import { Tenant } from './tenant.entity';

export const entities = [Plan, Subscription, Tenant, PlanPricing, SubscriptionHistory];
