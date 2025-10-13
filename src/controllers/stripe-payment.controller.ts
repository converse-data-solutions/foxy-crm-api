import {
  Controller,
  Inject,
  Post,
  Headers,
  Res,
  Req,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { StripePaymentService } from 'src/services/stripe-payment.service';
import Stripe from 'stripe';
import { STRIPE } from 'src/shared/utils/config.util';
import { Public } from 'src/common/decorators/public.decorator';
import { Request, Response } from 'express';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('stripe')
export class StripePaymentController {
  constructor(
    private readonly stripeWebhookService: StripePaymentService,
    @Inject('STRIPE_CLIENT') private stripe: Stripe,
  ) {}

  @Post('webhook')
  @SkipThrottle()
  @Public()
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') sig: string,
  ) {
    const endpointSecret = STRIPE.stripeWebhookSecret;
    let event: Stripe.Event;
    if (!endpointSecret) {
      throw new InternalServerErrorException({ message: 'Stripe webhook secrete key is missing' });
    }
    const rawBody = req.body;

    event = this.stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);

    // Pass to service for business logic
    await this.stripeWebhookService.processEvent(event);

    return res.status(HttpStatus.OK).json({ received: true });
  }
}
