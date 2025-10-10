import { MailerService } from '@nestjs-modules/mailer';
import { InjectQueue } from '@nestjs/bullmq';
import {
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { PAYMENT_URL, STRIPE } from 'src/shared/utils/config.util';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { invoiceTemplate, InvoiceTemplateOptions } from 'src/templates/invoice-template';
import Stripe from 'stripe';
import { Repository } from 'typeorm';

@Injectable()
export class StripePaymentService {
  constructor(
    @Inject('STRIPE_CLIENT') private stripe: Stripe,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly mailService: MailerService,
    @InjectQueue('subscription') private readonly subscriptionQueue: Queue,
  ) {}

  async createCheckoutSession(customerEmail: string, tenantId: string, priceId?: string) {
    return await this.stripe.checkout.sessions.create({
      metadata: {
        tenantId,
      },
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: PAYMENT_URL.successUrl, //front end success url
      cancel_url: PAYMENT_URL.failureUrl, //front end cancel url
    });
  }

  async processEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event);
        break;

      default:
    }
  }

  private async handleCheckoutCompleted(event: Stripe.Event) {
    const session = event.data.object as Stripe.Checkout.Session;
    const secreteKey = STRIPE.stripeSecreteKey;
    if (!secreteKey) {
      throw new InternalServerErrorException('Stripe Secrete key is missing');
    }

    // Retrieve session details
    const stripeResponse = await this.stripe.checkout.sessions.retrieve(session.id, {
      expand: ['subscription', 'customer', 'invoice'],
    });

    // TenantId can be stored in metadata when creating the session
    const tenantId = stripeResponse.metadata?.tenantId;
    if (!tenantId) throw new UnauthorizedException('Missing tenant ID');

    const existingSubscription = await this.subscriptionRepo.findOne({
      where: { tenant: { schemaName: tenantId } },
      relations: { planPrice: true, tenant: true },
    });

    if (!existingSubscription) {
      throw new UnauthorizedException('Invalid tenant');
    }

    const stripeSubscription = stripeResponse.subscription as Stripe.Subscription;
    const stripeCustomer = stripeResponse.customer as Stripe.Customer;
    const stripeInvoice = stripeResponse.invoice as Stripe.Invoice;

    const endDate = new Date(stripeSubscription.start_date * 1000);
    const interval_count = stripeSubscription.items.data[0].price.recurring?.interval_count ?? 1;
    endDate.setMonth(endDate.getMonth() + interval_count);

    existingSubscription.stripeCustomerId = stripeCustomer.id;
    existingSubscription.startDate = new Date(stripeSubscription.start_date * 1000);
    existingSubscription.status = true;
    existingSubscription.stripeSessionId = session.id;
    existingSubscription.stripeSubscriptionId = stripeSubscription.id;
    existingSubscription.endDate = endDate;

    const subscription = await this.subscriptionRepo.save(existingSubscription);
    await this.subscriptionQueue.add('change-subscription-plan', subscription);

    // Send invoice mail
    const name = stripeCustomer.name ?? existingSubscription.tenant.userName;
    const option: InvoiceTemplateOptions = {
      userName: name,
      amount: stripeInvoice.amount_paid,
      currency: stripeInvoice.currency,
      dueDate: stripeInvoice.due_date
        ? new Date(stripeInvoice.due_date * 1000).toDateString()
        : undefined,
      hostedInvoiceUrl: stripeInvoice.hosted_invoice_url ?? undefined,
      invoiceNumber: stripeInvoice.number ?? undefined,
      invoicePdf: stripeInvoice.invoice_pdf ?? undefined,
    };
    const html = invoiceTemplate(option);
    const to = stripeCustomer.email ?? existingSubscription.tenant.email;
    await this.mailService.sendMail({ to, html, subject: `Invoice ${stripeInvoice.number}` });

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Payment verified via webhook',
    };
  }

  private async handlePaymentFailed(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice;
    const stripeSubscription = invoice.parent?.subscription_details?.subscription;
    const subscriptionId =
      typeof stripeSubscription == 'string'
        ? stripeSubscription
        : !stripeSubscription
          ? undefined
          : stripeSubscription.id;
    if (subscriptionId) {
      const subscription = await this.subscriptionRepo.findOne({
        where: { stripeSubscriptionId: subscriptionId },
      });
      if (subscription) {
        subscription.status = false;
        await this.subscriptionRepo.save(subscription);
      }
    }
  }
}
