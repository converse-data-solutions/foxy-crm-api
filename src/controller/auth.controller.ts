import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Tenant } from 'src/database/entity/base-app/tenant.entity';
import { Repository } from 'typeorm';
import { TenantSignupDto } from 'src/dto/tenant-signup.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
  ) {}

  @Post('tenant-signup')
  @ApiOperation({ summary: 'Signup tenant and automated initial setup' })
  @ApiResponse({ status: 201, description: 'Signup process completed' })
  async tenantSignup(@Body() tenant: TenantSignupDto) {
    return await this.authService.signup(tenant);
  }

  @Post('user-signup')
  @ApiOperation({ summary: 'Signup user and access token is generated' })
  @ApiResponse({ status: 201, description: 'Signup process completed' })
  async userSignup() {}
}
