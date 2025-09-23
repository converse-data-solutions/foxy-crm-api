import { Controller, Get, Post, Body, Param, Headers } from '@nestjs/common';
import { DealService } from '../service/deal.service';
import { CreateDealDto } from 'src/dto/deal-dto/create-deal.dto';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { User } from 'src/database/entity/core-app/user.entity';

@Controller('deal')
export class DealController {
  constructor(private readonly dealService: DealService) {}

  @Post()
  async create(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: User,
    @Body() createDealDto: CreateDealDto,
  ) {
    return await this.dealService.create(tenantId, user, createDealDto);
  }

  @Get()
  findAll() {
    return this.dealService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dealService.findOne(+id);
  }
}
