import { Controller, Get, Post, Body, Headers, Query, Put, Param, UseGuards } from '@nestjs/common';
import { DealService } from '../services/deal.service';
import { CreateDealDto } from 'src/dtos/deal-dto/create-deal.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { GetDealDto } from 'src/dtos/deal-dto/get-deal.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from 'src/enums/core-app.enum';
import { UpdateDealDto } from 'src/dtos/deal-dto/update-deal.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CsrfHeader } from 'src/common/decorators/csrf-header.decorator';
import { TenantThrottlerGuard } from 'src/guards/tenant-throttler.guard';

@Roles(Role.SuperAdmin, Role.Admin, Role.Manager)
@UseGuards(TenantThrottlerGuard)
@Controller('deals')
export class DealController {
  constructor(private readonly dealService: DealService) {}

  @Post()
  @CsrfHeader()
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
  @Roles(Role.SuperAdmin, Role.Admin, Role.Manager, Role.SalesRep)
  @ApiOperation({ summary: 'Get deal info' })
  @ApiResponse({ status: 200, description: 'Deal info retrived successfully' })
  async findAllDeals(
    @Headers('x-tenant-id') tenantId: string,
    @Query() dealQuery: GetDealDto,
    @CurrentUser() user: User,
  ) {
    return await this.dealService.findAllDeals(tenantId, dealQuery, user);
  }

  @Put(':id')
  @CsrfHeader()
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
