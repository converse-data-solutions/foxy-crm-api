import { Controller, Get, Post, Req, Body } from '@nestjs/common';
import { SubscriptionService } from '../services/subscription.service';
import { Request } from 'express';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscribeDto } from 'src/dtos/subscribe-dto/subscribe.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';
import { StripePaymentService } from 'src/services/stripe-payment.service';

@Controller('plans')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly stripeService: StripePaymentService,
  ) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Make a subscription' })
  @ApiResponse({ status: 201, description: 'Subscribed to the plan' })
  async createSubscription(@Body() subscribe: SubscribeDto, @Req() request: Request) {
    const token: string | undefined = request?.cookies['access_token'];
    return await this.subscriptionService.createSubscription(subscribe, token);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'View all plans' })
  async findAllPlans(@Req() request: Request) {
    return this.subscriptionService.findAllPlans(request);
  }

  @Get('current')
  @Public()
  @ApiOperation({ summary: 'Get current subscription plan' })
  async findCurrentplan(@Req() request: Request) {
    return this.subscriptionService.findCurrentPlan(request);
  }

  @Get('success')
  @Public()
  async paymentSuccess() {
    return { success: true, statusCode: 200, message: 'Payment done' };
  }
}
