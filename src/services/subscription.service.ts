import { BadRequestException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { APIResponse } from 'src/common/dtos/response.dto';
import { Plan } from 'src/database/entities/base-app-entities/plan.entity';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { Tenant } from 'src/database/entities/base-app-entities/tenant.entity';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { SubscribeDto } from 'src/dtos/subscribe-dto/subscribe.dto';
import { StatusCause } from 'src/enums/status.enum';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { subscriptionReminderTemplate } from 'src/templates/subscription-remainder.template';
import { Repository } from 'typeorm';
import { PlanPricing } from 'src/database/entities/base-app-entities/plan-pricing.entity';
import { StripePaymentService } from './stripe-payment.service';
import { TokenService } from './token.service';
import { EmailService } from './email.service';
import { SubscriptionHistory } from 'src/database/entities/base-app-entities/subscription-history.entity';
import { JwtPayload } from 'src/common/dtos/jwt-payload.dto';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Plan) private readonly planRepo: Repository<Plan>,
    @InjectRepository(PlanPricing) private readonly planPriceRepo: Repository<PlanPricing>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(SubscriptionHistory)
    private readonly subscriptionHistoryRepo: Repository<SubscriptionHistory>,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    private readonly emailService: EmailService,
    private readonly stripeService: StripePaymentService,
    private readonly tokenService: TokenService,
  ) {}

  async createSubscription(
    subscribe: SubscribeDto,
    token: string | undefined,
  ): Promise<APIResponse> {
    if (!token) {
      throw new UnauthorizedException('Unauthorized access token not found');
    }
    const payload = await this.tokenService.verifyToken(token);
    const planPrice = await this.planPriceRepo.findOne({
      where: { id: subscribe.planId },
      relations: { plan: true },
    });
    const tenant = await this.checkTenant(payload);
    if (!planPrice) {
      throw new BadRequestException('Invalid subscription plan');
    }

    const tenantSubscription = await this.subscriptionRepo
      .createQueryBuilder('subscription')
      .leftJoin('subscription.tenant', 'tenant')
      .leftJoinAndSelect('subscription.planPrice', 'planPrice')
      .leftJoinAndSelect('planPrice.plan', 'plan')
      .andWhere('tenant.id = :id', { id: payload.id })
      .getOne();

    if (tenantSubscription) {
      if (tenantSubscription && tenantSubscription.endDate) {
        if (
          Number(tenantSubscription.planPrice.plan.userCount) > Number(planPrice.plan.userCount) &&
          tenantSubscription.status === true
        ) {
          throw new BadRequestException(
            'Cannot downgrade subscription while an active plan exists',
          );
        }
      }
      tenantSubscription.planPrice = planPrice;
      await this.subscriptionRepo.save(tenantSubscription);
    }

    const session = await this.stripeService.createCheckoutSession(
      payload.email,
      tenant.schemaName,
      planPrice.stripePriceId,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Payment link is retrived successfully',
      paymentUrl: session.url,
    };
  }

  async findAllPlans(request: Request): Promise<APIResponse<Plan[]>> {
    const token: string | undefined = request?.cookies['tenant_access_token'];
    if (!token) {
      throw new UnauthorizedException('Unauthorized access token not found');
    }
    const payload = await this.tokenService.verifyToken(token);
    await this.checkTenant(payload);
    const plans = await this.planRepo.find({ relations: { planPricings: true } });

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Fetched subscription plans',
      data: plans,
    };
  }

  async findCurrentPlan(request: Request) {
    const token: string | undefined = request?.cookies['tenant_access_token'];
    if (!token) {
      throw new UnauthorizedException('Unauthorized access token not found');
    }
    const payload = await this.tokenService.verifyToken(token);
    const subscription = await this.planPriceRepo.findOne({
      where: {
        tenantsSubscription: {
          tenant: { id: payload.id },
          status: true,
        },
      },
      relations: { tenantsSubscription: true, plan: true },
    });
    if (!subscription) {
      throw new BadRequestException('There is no active or current subscription');
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Fetched the current plan',
      data: subscription,
    };
  }

  async expireSubscription(id: string) {
    const tenantSubscription = await this.subscriptionRepo.findOne({
      where: { id },
      relations: { tenant: true },
    });
    if (tenantSubscription && tenantSubscription.endDate) {
      tenantSubscription.status = false;
      await this.subscriptionRepo.save(tenantSubscription);
    }
    await this.subscriptionHistoryRepo.update(
      { tenant: { id: tenantSubscription?.tenant.id }, status: true },
      { status: false },
    );
  }
  async subscriptionRemainder(id: string) {
    const tenantSubscription = await this.subscriptionRepo.findOne({
      where: { id },
      relations: { tenant: true },
    });
    if (tenantSubscription && tenantSubscription.endDate) {
      const html = subscriptionReminderTemplate(
        tenantSubscription.tenant.userName,
        tenantSubscription.endDate,
      );
      await this.emailService.sendMail({
        to: tenantSubscription.tenant.email,
        html,
        subject: `Reminder: Subscription Expiry on ${tenantSubscription.endDate.getDate()}`,
      });
    }
  }

  async changeSubscriptionPlans(subscription: Subscription) {
    const planPriceId = subscription.planPrice.id;
    const plan = await this.planRepo.findOne({
      where: { planPricings: { id: planPriceId } },
    });
    const schemaName = subscription.tenant.schemaName;
    const userRepo = await getRepo(User, schemaName);
    const users = await userRepo.find({
      order: { createdAt: 'ASC' },
    });
    for (let i = 0; i < users.length; i++) {
      if (plan?.userCount) {
        if (i + 1 > plan.userCount) {
          users[i].status = false;
          users[i].statusCause = StatusCause.Plan_Limit;
        } else {
          if (users[i].status === false && users[i].statusCause === StatusCause.Plan_Limit) {
            users[i].status = true;
            users[i].statusCause = null;
          }
        }
      }
    }
    await userRepo.save(users);
  }

  private async checkTenant(payload: JwtPayload) {
    const tenant = await this.tenantRepo.findOne({ where: { id: payload.id } });
    if (!tenant) {
      throw new UnauthorizedException('Unauthorized access');
    }
    return tenant;
  }
}
