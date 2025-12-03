import { AuditLog } from './audit-log.entity';
import { PlanPricing } from './plan-pricing.entity';
import { Plan } from './plan.entity';
import { SubscriptionHistory } from './subscription-history.entity';
import { Subscription } from './subscription.entity';
import { Tenant } from './tenant.entity';

export const entities = [Plan, AuditLog, Subscription, Tenant, PlanPricing, SubscriptionHistory];
