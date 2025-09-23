import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Public } from 'src/common/decorator/public.decorator';
import { StripeService } from 'src/service/stripe.service';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('checkout')
  @Public()
  async createCheckout(@Body() body: { email: string; priceId: string }) {
    const session = await this.stripeService.createCheckoutSession(body.email, body.priceId);
    return { url: session.url };
  }

  @Get('session')
  @Public()
  async getSession(@Query('id') id: string) {
    return this.stripeService.getSession(id);
  }
}
