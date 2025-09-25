import { Body, Controller, Headers, HttpStatus, Post, Res } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { TenantSignupDto } from 'src/dto/tenant-dto/tenant-signup.dto';
import { ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { Signin, UserSignupDto } from 'src/dto/user-dto/user-signup.dto';
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
  async userSignup(@Body() user: UserSignupDto, @Headers('x-tenant-id') tenantId: string) {
    return await this.authService.userSignup(user, tenantId);
  }

  @Public()
  @Post('signin')
  @ApiHeader({
    name: 'x-tenant-id',
    description: 'Tenant identifier',
    required: false,
  })
  @ApiOperation({ summary: 'Signin user and access token is generated' })
  @ApiResponse({ status: 200, description: 'Signin successfully' })
  async userSignin(
    @Body() user: Signin,
    @Res() response: Response,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    const token = await this.authService.userSignin(user, tenantId);
    const cookieName = tenantId ? 'access_token' : 'tenant_access_token';
    response.cookie(cookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });
    response.status(HttpStatus.OK);
    response.json({
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Signin successfull',
    });
  }
}
