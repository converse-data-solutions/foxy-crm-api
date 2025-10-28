import { Controller, Get, Post, Req, Body } from '@nestjs/common';
import { SubscriptionService } from '../services/subscription.service';
import { Request } from 'express';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscribeDto } from 'src/dtos/subscribe-dto/subscribe.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { SkipCsrf } from 'src/common/decorators/skip-csrf.decorator';

@SkipCsrf()
@Public()
@Controller('plans')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @ApiOperation({ summary: 'Make a subscription' })
  @ApiResponse({ status: 201, description: 'Subscribed to the plan' })
  async createSubscription(@Body() subscribe: SubscribeDto, @Req() request: Request) {
    const token: string | undefined = request?.cookies['access_token'];
    return await this.subscriptionService.createSubscription(subscribe, token);
  }

  @Get()
  @ApiOperation({ summary: 'View all plans' })
  @ApiResponse({ status: 200, description: 'Retrieved all plans' })
  async findAllPlans(@Req() request: Request) {
    return this.subscriptionService.findAllPlans(request);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current subscription plan' })
  @ApiResponse({ status: 200, description: 'Retrieved current subscription plan' })
  async findCurrentplan(@Req() request: Request) {
    return this.subscriptionService.findCurrentPlan(request);
  }

  @Get('success')
  async paymentSuccess() {
    return { success: true, statusCode: 200, message: 'Payment done' };
  }
}
