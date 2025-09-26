import { Controller, Get, Post, Body, Headers, Query, Put, Param } from '@nestjs/common';
import { DealService } from '../service/deal.service';
import { CreateDealDto } from 'src/dto/deal-dto/create-deal.dto';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { User } from 'src/database/entity/core-app/user.entity';
import { GetDealDto } from 'src/dto/deal-dto/get-deal.dto';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/enum/core-app.enum';
import { UpdateDealDto } from 'src/dto/deal-dto/update-deal.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Roles(Role.Admin, Role.SalesRep, Role.Manager)
@Controller('deal')
export class DealController {
  constructor(private readonly dealService: DealService) {}

  @Post()
  @ApiOperation({ summary: 'Create deal info' })
  @ApiResponse({ status: 201, description: 'Deal info created successfully' })
  async createDeal(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: User,
    @Body() createDealDto: CreateDealDto,
  ) {
    return await this.dealService.createDeal(tenantId, user, createDealDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get deal info' })
  @ApiResponse({ status: 200, description: 'Deal info retrived successfully' })
  async findAllDeals(@Headers('x-tenant-id') tenantId: string, @Query() dealQuery: GetDealDto) {
    return await this.dealService.findAllDeals(tenantId, dealQuery);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update deal info' })
  @ApiResponse({ status: 200, description: 'Deal info updated successfully' })
  async updateDeal(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateDeal: UpdateDealDto,
  ) {
    return await this.dealService.updateDeal(tenantId, user, id, updateDeal);
  }
}
