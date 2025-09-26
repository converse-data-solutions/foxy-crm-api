import { Controller, Get, Post, Req, Body, Query } from '@nestjs/common';
import { SubscriptionService } from '../service/subscription.service';
import { Request } from 'express';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscribeDto } from 'src/dto/subscribe-dto/subscribe.dto';
import { Public } from 'src/common/decorator/public.decorator';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Make a subscription' })
  @ApiResponse({ status: 201, description: 'Subscribed to the plan' })
  async create(@Body() subscribe: SubscribeDto, @Req() request: Request) {
    const token: string | undefined = request?.cookies['tenant_access_token'];
    return await this.subscriptionService.create(subscribe, token);
  }

  @Get()
  @Public()
  async findAll(@Req() request: Request) {
    return this.subscriptionService.findAll(request);
  }

  @Get('session')
  @Public()
  async getSession(@Query('id') id: string, @Query('key') token: string) {
    return this.subscriptionService.getSession(id, token);
  }
}
