import { Controller, Get, Post, Param, Req } from '@nestjs/common';
import { SubscriptionService } from '../service/subscription.service';
import { Public } from 'src/common/decorator/public.decorator';
import { Request } from 'express';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscribeDto } from 'src/dto/subscribe-dto/subscribe.dto';
import { plainToInstance } from 'class-transformer';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Make a subscription' })
  @ApiResponse({ status: 201, description: 'Subscribed to the plan' })
  async create(@Req() request: Request) {
    const subscribe = plainToInstance(SubscribeDto, request.body);
    const token: string | undefined = request?.cookies['tenant_access_token'];
    return await this.subscriptionService.create(subscribe, token);
  }

  @Get()
  @Public()
  async findAll(@Req() request: Request) {
    return this.subscriptionService.findAll(request);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionService.findOne(+id);
  }
}
