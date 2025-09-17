import {
  Body,
  Controller,
  Headers,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { TenantSignupDto } from 'src/dto/tenant-signup.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { Signin, UserSignupDto } from 'src/dto/user-signup.dto';
import { Public } from 'src/common/decorator/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('tenant-signup')
  @ApiOperation({ summary: 'Signup tenant and automated initial setup' })
  @ApiResponse({ status: 201, description: 'Signup process completed' })
  async tenantSignup(@Body() tenant: TenantSignupDto) {
    return await this.authService.tenantSignup(tenant);
  }

  @Public()
  @Post('user-signup')
  @ApiOperation({ summary: 'Signup or create a new account' })
  @ApiResponse({ status: 201, description: 'Signup process completed' })
  async userSignup(
    @Body() user: UserSignupDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return await this.authService.userSignup(user, tenantId);
  }

  @Public()
  @Post('user-signin')
  @ApiOperation({ summary: 'Signin user and access token is generated' })
  @ApiResponse({ status: 200, description: 'Signin successfully' })
  async userSignin(
    @Body() user: Signin,
    @Headers('x-tenant-id') tenantId: string,
    @Res() response: Response,
  ) {
    const token = await this.authService.userSignin(user, tenantId);
    response.cookie('access_token', token);
    response.status(HttpStatus.OK);
    response.json({
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Signin successfull',
    });
  }
}
