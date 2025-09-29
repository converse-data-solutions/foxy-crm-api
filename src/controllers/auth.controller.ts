import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { TenantSignupDto } from 'src/dto/tenant-dto/tenant-signup.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { Signin, UserSignupDto } from 'src/dto/user-dto/user-signup.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { EmailDto, OtpDto } from 'src/dto/otp-dto/otp.dto';

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
  async userSignup(@Body() user: UserSignupDto) {
    return await this.authService.userSignup(user);
  }

  @Public()
  @Post('signin')
  @ApiOperation({ summary: 'Signin user and access token is generated' })
  @ApiResponse({ status: 200, description: 'Signin successfully' })
  async userSignin(@Body() user: Signin, @Res() response: Response) {
    const token = await this.authService.userSignin(user);
    console.log(token);

    let cookieName = 'tenant_access_token';
    if (token.tenantAccessToken) {
      response.cookie(cookieName, token.tenantAccessToken, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });
    }
    cookieName = 'access_token';
    response.cookie(cookieName, token.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });
    response.status(HttpStatus.OK);
    response.json({
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Signin successfull',
      token,
    });
  }

  @Public()
  @Post('send-otp')
  @ApiOperation({ summary: 'Send otp to the mail' })
  @ApiResponse({ status: 200, description: 'Otp sent successfully' })
  async sendOtp(@Body() payload: EmailDto) {
    return await this.authService.sendOtp(payload.email);
  }

  @Public()
  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify the otp' })
  @ApiResponse({ status: 200, description: 'Otp verified successfully' })
  async verifyOtp(@Body() data: OtpDto) {
    return await this.authService.verifyOtp(data);
  }
}
