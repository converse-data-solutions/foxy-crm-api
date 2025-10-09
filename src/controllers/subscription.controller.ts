import { Controller, Get, Post, Req, Body, Query } from '@nestjs/common';
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
    const token: string | undefined = request?.cookies['tenant_access_token'];
    return await this.subscriptionService.createSubscription(subscribe, token);
  }

  @Get()
  @Public()
  async findAllPlans(@Req() request: Request) {
    return this.subscriptionService.findAllPlans(request);
  }

  @Get('current')
  @Public()
  async findCurrentplan(@Req() request: Request) {
    return this.subscriptionService.findCurrentPlan(request);
  }

  @SkipThrottle()
  @Get('session')
  @Public()
  async getSession(@Query('id') id: string, @Query('key') token: string) {
    return this.stripeService.getSession(id, token);
  }
}
