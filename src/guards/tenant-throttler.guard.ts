import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerStorage, ThrottlerModuleOptions } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SubscriptionService } from 'src/services/subscription.service';

@Injectable()
export class TenantThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly subscriptionService: SubscriptionService,
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: Request): Promise<string> {
    const tenantId = req.headers['x-tenant-id'] || 'unknown';
    const token: string = req.cookies['access_token'];

    const ip = req.ip;
    return `${tenantId}:${ip}`;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const plan = await this.subscriptionService.findCurrentPlan(request);
    const limit = plan.data.plan?.apiCallsPerMinute ?? 100;
    const throttlerRequestLimit = 1200;
    const ttl = 60 * 1000;
    const throttlerName = 'tenant-throttle';
    const blockDuration = 0;

    const key = await this.getTracker(request);

    const record = await this.storageService.increment(
      key,
      ttl,
      throttlerRequestLimit,
      blockDuration,
      throttlerName,
    );
    if (record.totalHits > limit) {
      throw new Error(`Rate limit exceeded (${limit}/min). Upgrade plan.`);
    }

    return true;
  }
}
