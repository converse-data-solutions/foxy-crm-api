import { Controller, Get, Param, Headers, Post, Body } from '@nestjs/common';
import { LeadActivityService } from '../services/lead-activity.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from 'src/enums/core-app.enum';
import { CreateLeadActivityDto } from 'src/dtos/activity-dto/create-lead-activity.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CsrfHeader } from 'src/common/decorators/csrf-header.decorator';

@Roles(Role.Admin, Role.SalesRep, Role.Manager)
@Controller('lead/activities')
export class LeadActivityController {
  constructor(private readonly leadActivityService: LeadActivityService) {}

  @ApiOperation({ summary: 'Create lead activity' })
  @ApiResponse({ status: 201, description: 'Lead activity created successfully' })
  @Post()
  @CsrfHeader()
  async create(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: User,
    @Body() createActivityDto: CreateLeadActivityDto,
  ) {
    return await this.leadActivityService.createLeadActivity(tenantId, user, createActivityDto);
  }

  @ApiOperation({ summary: 'Retrieve lead activity' })
  @ApiResponse({ status: 200, description: 'Lead activity retrieved successfully' })
  @Get(':id')
  async findAll(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: User,
    @Param('id') leadId: string,
  ) {
    return await this.leadActivityService.findAllLeadActivities(tenantId, user, leadId);
  }
}
