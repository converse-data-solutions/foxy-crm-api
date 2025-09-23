import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  constructor(@Inject('STRIPE_CLIENT') private stripe: Stripe) {}

  async createCheckoutSession(customerEmail: string, priceId: string) {
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
      success_url: 'http://localhost:8000/api/v1/stripe/session?id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:8000/cancel',
    });
  }
  async getSession(sessionId: string) {
    return this.stripe.checkout.sessions.retrieve(sessionId);
  }
}
