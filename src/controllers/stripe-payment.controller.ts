import {
  Controller,
  Inject,
  Post,
  Headers,
  Res,
  Req,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { StripePaymentService } from 'src/services/stripe-payment.service';
import Stripe from 'stripe';
import { STRIPE } from 'src/shared/utils/config.util';
import { Public } from 'src/common/decorators/public.decorator';
import { Request, Response } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { SkipSerializationInterceptor } from 'src/interceptors/skip-serialization.interceptor';

@Controller('stripe')
export class StripePaymentController {
  constructor(
    private readonly stripeWebhookService: StripePaymentService,
    @Inject('STRIPE_CLIENT') private stripe: Stripe,
  ) {}

  @UseInterceptors(SkipSerializationInterceptor)
  @Post('webhook')
  @SkipThrottle()
  @Public()
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') sig: string,
  ): Promise<void> {
    const endpointSecret = STRIPE.stripeWebhookSecret;
    if (!endpointSecret) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Stripe webhook secret is missing' });
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      await this.stripeWebhookService.processEvent(event);
    } catch (err) {
      console.error('Stripe webhook processing error:', err);
    }

    res.status(HttpStatus.OK).send({ received: true });
  }
}
