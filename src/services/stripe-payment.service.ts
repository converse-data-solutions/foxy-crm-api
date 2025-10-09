import { MailerService } from '@nestjs-modules/mailer';
import { InjectQueue } from '@nestjs/bullmq';
import { forwardRef, HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { PAYMENT_URL } from 'src/common/constant/config.constants';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { invoiceTemplate, InvoiceTemplateOptions } from 'src/templates/invoice-template';
import Stripe from 'stripe';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';

@Injectable()
export class StripePaymentService {
  constructor(
    @Inject('STRIPE_CLIENT') private stripe: Stripe,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly mailService: MailerService,
    @InjectQueue('subscription') private readonly subscriptionQueue: Queue,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}
  async getSession(sessionId: string, token: string) {
    const stripeResponse = await this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer', 'invoice'],
    });
    const payload = await this.authService.validateToken(token);
    const existingSubscription = await this.subscriptionRepo.findOne({
      where: { tenant: { id: payload.id } },
      relations: { planPrice: true, tenant: true },
    });
    if (!existingSubscription) {
      throw new UnauthorizedException('Unauthorized access invalid token');
    }

    const stripeSubscription = stripeResponse.subscription as Stripe.Subscription;
    const stripeCustomer = stripeResponse.customer as Stripe.Customer;
    const stripeInvoice = stripeResponse.invoice as Stripe.Invoice;

    const endDate = new Date(stripeSubscription.start_date * 1000);
    const interval_count = stripeSubscription.items.data[0].price.recurring?.interval_count;
    const month = interval_count ?? 2;
    endDate.setMonth(endDate.getMonth() + month);

    existingSubscription.stripeCustomerId = stripeCustomer.id;
    existingSubscription.startDate = new Date(stripeSubscription.start_date * 1000);
    existingSubscription.status = true;
    existingSubscription.stripeSessionId = sessionId;
    existingSubscription.stripeSubscriptionId = stripeSubscription.id;
    existingSubscription.endDate = endDate;

    const subscription = await this.subscriptionRepo.save(existingSubscription);
    await this.subscriptionQueue.add('change-subscription-plan', subscription);
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
    await this.mailService.sendMail({ to, html, subject: `Invoice${stripeInvoice.number}` });

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Payment Details verified',
    };
  }

  async createCheckoutSession(customerEmail: string, token: string, priceId?: string) {
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
      success_url: PAYMENT_URL.success_url + token, //front end success url
      cancel_url: PAYMENT_URL.failure_url, //front end cancel url
    });
  }
}
