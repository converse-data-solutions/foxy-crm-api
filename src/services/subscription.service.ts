import { MailerService } from '@nestjs-modules/mailer';
import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Request } from 'express';
import { JwtPayload } from 'src/common/dtos/jwt-payload.dto';
import { APIResponse } from 'src/common/dtos/response.dto';
import { Plan } from 'src/database/entities/base-app-entities/plan.entity';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { Tenant } from 'src/database/entities/base-app-entities/tenant.entity';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { SubscribeDto } from 'src/dtos/subscribe-dto/subscribe.dto';
import { StatusCause } from 'src/enums/status.enum';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { invoiceTemplate, InvoiceTemplateOptions } from 'src/templates/invoice-template';
import { subscriptionReminderTemplate } from 'src/templates/subscription-remainder.template';
import Stripe from 'stripe';
import { Repository } from 'typeorm';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Plan) private readonly planRepo: Repository<Plan>,
    @Inject('STRIPE_CLIENT') private stripe: Stripe,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    private readonly mailService: MailerService,
    @InjectQueue('subscription') private readonly subscriptionQueue: Queue,
  ) {}

  async create(subscribe: SubscribeDto, token: string | undefined): Promise<APIResponse> {
    if (!token) {
      throw new UnauthorizedException({ message: 'Unauthorized access token not found' });
    }
    const payload = await this.validateToken(token);
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
    });

    if (tenantSubscription) {
      tenantSubscription.plan = plan;
      await this.subscriptionRepo.save(tenantSubscription);
    } else {
      await this.subscriptionRepo.save({ plan, tenant });
    }

    const session = await this.createCheckoutSession(payload.email, plan.priceId, token);
    return {
      success: true,
      statusCode: HttpStatus.ACCEPTED,
      message: 'Payment link is retrived successfully',
      paymentUrl: session.url,
    };
  }

  async findAll(request: Request): Promise<APIResponse<Plan[]>> {
    const token: string | undefined = request?.cookies['tenant_access_token'];
    if (!token) {
      throw new UnauthorizedException({ message: 'Unauthorized access token not found' });
    }
    await this.validateToken(token);
    const plans = await this.planRepo.find();

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Fetched subscription plans',
      data: plans,
    };
  }

  private async validateToken(token: string) {
    const verifyToken: JwtPayload = await this.jwtService.verifyAsync(token, {
      secret: process.env.SECRET_KEY,
    });
    return verifyToken;
  }

  async getSession(sessionId: string, token: string) {
    const stripeResponse = await this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer', 'invoice'],
    });
    const payload = await this.validateToken(token);
    const existingSubscription = await this.subscriptionRepo.findOne({
      where: { tenant: { id: payload.id } },
      relations: { plan: true, tenant: true },
    });
    if (!existingSubscription) {
      throw new UnauthorizedException({ message: 'Unauthorized access invalid token' });
    }

    const stripeSubscription = stripeResponse.subscription as Stripe.Subscription;
    const stripeCustomer = stripeResponse.customer as Stripe.Customer;
    const stripeInvoice = stripeResponse.invoice as Stripe.Invoice;

    const endDate = new Date(stripeSubscription.start_date * 1000);
    const interval_count = stripeSubscription.items.data[0].price.recurring?.interval_count;
    const month = interval_count
      ? interval_count
      : Number(existingSubscription.plan.validUpto.split(' ')[0]);
    endDate.setMonth(endDate.getMonth() + month);

    existingSubscription.stripeCustomerId = stripeCustomer.id;
    existingSubscription.startDate = new Date(stripeSubscription.start_date * 1000);
    existingSubscription.status = true;
    existingSubscription.stripeSessionId = sessionId;
    existingSubscription.stripeSubscriptionId = stripeSubscription.id;
    existingSubscription.endDate = endDate;

    const subscription = await this.subscriptionRepo.save(existingSubscription);
    await this.subscriptionQueue.add('change-subscription-plan', subscription);
    const name = stripeCustomer.name ? stripeCustomer.name : existingSubscription.tenant.userName;
    const option: InvoiceTemplateOptions = {
      userName: name,
      amount: stripeInvoice.amount_paid,
      currency: stripeInvoice.currency,
      dueDate: stripeInvoice.due_date
        ? new Date(stripeInvoice.due_date * 1000).toDateString()
        : undefined,
      hostedInvoiceUrl: stripeInvoice.hosted_invoice_url
        ? stripeInvoice.hosted_invoice_url
        : undefined,
      invoiceNumber: stripeInvoice.number ? stripeInvoice.number : undefined,
      invoicePdf: stripeInvoice.invoice_pdf ? stripeInvoice.invoice_pdf : undefined,
    };
    const html = invoiceTemplate(option);
    const to = stripeCustomer.email ? stripeCustomer.email : existingSubscription.tenant.email;
    await this.mailService.sendMail({ to, html, subject: `Invoice${stripeInvoice.number}` });

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Payment Details verified',
    };
  }

  private async createCheckoutSession(customerEmail: string, priceId: string, token: string) {
    return await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `http://localhost:8000/api/v1/plans/session?id={CHECKOUT_SESSION_ID}&key=${token}`, //front end success url
      cancel_url: 'http://localhost:8000/cancel', //front end cancel url
    });
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
