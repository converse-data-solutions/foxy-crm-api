import { Controller, Get, Post, Body, Param, Headers, Put, Query } from '@nestjs/common';
import { AccountService } from '../services/account.service';
import { CreateAccountDto } from 'src/dto/account-dto/create-account.dto';
import { UpdateAccountDto } from 'src/dto/account-dto/update-account.dto';
import { User } from 'src/database/entity/core-app/user.entity';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from 'src/enums/core-app.enum';
import { GetAccountDto } from 'src/dto/account-dto/get-account.dto';

@Roles(Role.Admin, Role.Manager)
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  @ApiOperation({ summary: 'Create new account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  async create(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: User,
    @Body() createAccountDto: CreateAccountDto,
  ) {
    return await this.accountService.create(tenantId, user, createAccountDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get Account details' })
  @ApiResponse({ status: 200, description: 'Account details fetched successfully' })
  async findAll(@Headers('x-tenant-id') tenantId: string, @Query() accountQuery: GetAccountDto) {
    return await this.accountService.findAll(tenantId, accountQuery);
  }

  @Put(':id')
  @Roles(Role.Admin, Role.Manager, Role.SalesRep)
  async update(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    return await this.accountService.update(tenantId, id, updateAccountDto);
  }
}
