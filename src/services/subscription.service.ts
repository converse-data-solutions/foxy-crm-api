import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
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
import { StripePaymentService } from './stripe-payment.service';
import { AuthService } from './auth.service';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Plan) private readonly planRepo: Repository<Plan>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    private readonly mailService: MailerService,
    private readonly stripeService: StripePaymentService,
    private readonly authService: AuthService,
  ) {}

  async createSubscription(
    subscribe: SubscribeDto,
    token: string | undefined,
  ): Promise<APIResponse> {
    if (!token) {
      throw new UnauthorizedException({ message: 'Unauthorized access token not found' });
    }
    const payload = await this.authService.validateToken(token);
    const plan = await this.planRepo.findOne({ where: { id: subscribe.id } });
    const tenant = await this.tenantRepo.findOne({ where: { id: payload.id } });
    if (!plan) {
      throw new BadRequestException({ message: 'Invalid subscription id' });
    }
    if (!tenant) {
      throw new UnauthorizedException({ message: 'Unauthorized access invalid tenant' });
    }
    const tenantSubscription = await this.subscriptionRepo.findOne({
      where: { tenant: { id: payload.id } },
      relations: { plan: true },
    });

    if (tenantSubscription) {
      if (
        tenantSubscription.endDate &&
        tenantSubscription.endDate > new Date() &&
        tenantSubscription.plan.price > plan.price
      ) {
        throw new BadRequestException('Cannot downgrade subscription while an active plan exists');
      } else {
        tenantSubscription.plan = plan;
        await this.subscriptionRepo.save(tenantSubscription);
      }
    } else {
      await this.subscriptionRepo.save({ plan, tenant });
    }

    const session = await this.stripeService.createCheckoutSession(
      payload.email,
      plan.priceId,
      token,
    );
    return {
      success: true,
      statusCode: HttpStatus.ACCEPTED,
      message: 'Payment link is retrived successfully',
      paymentUrl: session.url,
    };
  }

  async findAllPlans(request: Request): Promise<APIResponse<Plan[]>> {
    const token: string | undefined = request?.cookies['tenant_access_token'];
    if (!token) {
      throw new UnauthorizedException({ message: 'Unauthorized access token not found' });
    }
    await this.authService.validateToken(token);
    const plans = await this.planRepo.find();

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Fetched subscription plans',
      data: plans,
    };
  }

  async findCurrentPlan(
    request: Request,
  ): Promise<APIResponse<Omit<Subscription, 'plan'> & { plan: Partial<Plan> }>> {
    const token: string | undefined = request?.cookies['tenant_access_token'];
    if (!token) {
      throw new UnauthorizedException({ message: 'Unauthorized access token not found' });
    }
    const payload = await this.authService.validateToken(token);
    const subscription = await this.subscriptionRepo.findOne({
      where: { tenant: { id: payload.id }, status: true },
      relations: { plan: true },
    });
    if (!subscription) {
      throw new BadRequestException({ message: 'There is no active or current subscription' });
    }
    const {
      plan: { priceId, id, ...planDetails },
      ...subscriptionDetails
    } = subscription;
    const data = { plan: { ...planDetails }, ...subscriptionDetails };
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Fetched the current plan',
      data,
    };
  }

  async expireSubscription(id: string) {
    const tenantSubscription = await this.subscriptionRepo.findOne({
      where: { id },
    });
    if (tenantSubscription && tenantSubscription.endDate) {
      tenantSubscription.status = false;
      await this.subscriptionRepo.save(tenantSubscription);
    }
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
      await this.mailService.sendMail({
        to: tenantSubscription.tenant.email,
        html,
        subject: `Reminder: Subscription Expiry on ${tenantSubscription.endDate.getDate()}`,
      });
    }
  }

  async changeSubscriptionPlans(subscription: Subscription) {
    const userCount = subscription.plan.userCount;
    const schemaName = subscription.tenant.schemaName;
    const userRepo = await getRepo(User, schemaName);
    const users = await userRepo.find({
      order: { createdAt: 'ASC' },
    });
    for (let i = 0; i < users.length; i++) {
      if (i + 1 > userCount) {
        users[i].status = false;
        users[i].statusCause = StatusCause.Plan_Limit;
      } else {
        if (users[i].status === false) {
          users[i].status = true;
          users[i].statusCause = null;
        }
      }
    }
    await userRepo.save(users);
  }
}
