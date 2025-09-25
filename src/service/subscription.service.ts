import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { JwtPayload } from 'src/common/dto/jwt-payload.dto';
import { APIResponse } from 'src/common/dto/response.dto';
import { Subscription } from 'src/database/entity/base-app/subscription.entity';
import { TenantSubscription } from 'src/database/entity/base-app/tenant-subscription.entity';
import { Tenant } from 'src/database/entity/base-app/tenant.entity';
import { SubscribeDto } from 'src/dto/subscribe-dto/subscribe.dto';
import { invoiceTemplate, InvoiceTemplateOptions } from 'src/template/invoice-template';
import { subscriptionReminderTemplate } from 'src/template/subscription-remainder.template';
import Stripe from 'stripe';
import { Repository } from 'typeorm';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Subscription) private readonly subscriptionRepo: Repository<Subscription>,
    @Inject('STRIPE_CLIENT') private stripe: Stripe,
    @InjectRepository(TenantSubscription)
    private readonly tenantSubRepo: Repository<TenantSubscription>,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    private readonly mailService: MailerService,
  ) {}

  async create(subscribe: SubscribeDto, token: string | undefined): Promise<APIResponse> {
    if (!token) {
      throw new UnauthorizedException({ message: 'Unauthorized access token not found' });
    }
    const payload = await this.validateToken(token);
    const subscription = await this.subscriptionRepo.findOne({ where: { id: subscribe.id } });
    const tenant = await this.tenantRepo.findOne({ where: { id: payload.id } });
    if (!subscription) {
      throw new BadRequestException({ message: 'Invalid subscription id' });
    }
    const tenantSubscription = await this.tenantSubRepo.findOne({
      where: { tenant: { id: payload.id } },
    });

    if (!tenantSubscription && tenant) {
      await this.tenantSubRepo.save({
        subscription: subscription,
        tenant: tenant,
      });
    }

    const session = await this.createCheckoutSession(payload.email, subscription.priceId, token);
    return {
      success: true,
      statusCode: HttpStatus.ACCEPTED,
      message: 'Payment link is retrived successfully',
      paymentUrl: session.url,
    };
  }

  async findAll(request: Request): Promise<APIResponse<Subscription[]>> {
    const token: string | undefined = request?.cookies['tenant_access_token'];
    if (!token) {
      throw new UnauthorizedException({ message: 'Unauthorized access token not found' });
    }
    const payload = await this.validateToken(token);
    const subscriptions = await this.subscriptionRepo.find();

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Fetched subscription plans',
      data: subscriptions,
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
    const existingSubscription = await this.tenantSubRepo.findOne({
      where: { tenant: { id: payload.id } },
      relations: { subscription: true, tenant: true },
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
      : Number(existingSubscription.subscription.validUpto.split(' ')[0]);
    endDate.setMonth(endDate.getMonth() + month);

    existingSubscription.stripeCustomerId = stripeCustomer.id;
    existingSubscription.startDate = new Date(stripeSubscription.start_date * 1000);
    existingSubscription.status = true;
    existingSubscription.stripeSessionId = sessionId;
    existingSubscription.stripeSubscriptionId = stripeSubscription.id;
    existingSubscription.endDate = endDate;

    await this.tenantSubRepo.save(existingSubscription);
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
      success_url: `http://localhost:8000/api/v1/subscription/session?id={CHECKOUT_SESSION_ID}&key=${token}`, //front end success url
      cancel_url: 'http://localhost:8000/cancel', //front end cancel url
    });
  }

  async expireSubscription(id: string) {
    const tenantSubscription = await this.tenantSubRepo.findOne({
      where: { id },
    });
    if (tenantSubscription && tenantSubscription.endDate) {
      tenantSubscription.status = false;
      await this.tenantSubRepo.save(tenantSubscription);
    }
  }
  async subscriptionRemainder(id: string) {
    const tenantSubscription = await this.tenantSubRepo.findOne({
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
}
