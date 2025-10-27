import { Body, Controller, Get, HttpStatus, Post, Req, Res, Headers } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { TenantSignupDto } from 'src/dtos/tenant-dto/tenant-signup.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { SignIn, UserSignupDto } from 'src/dtos/user-dto/user-signup.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { EmailDto, OtpDto } from 'src/dtos/otp-dto/otp.dto';
import { TenantService } from 'src/services/tenant.service';
import { OtpService } from 'src/services/otp.service';
import { UserService } from 'src/services/user.service';
import { ForgotPasswordDto, ResetPasswordDto } from 'src/dtos/password-dto/reset-password.dto';
import { setCookie } from 'src/shared/utils/cookie.util';
import { APIResponse } from 'src/common/dtos/response.dto';
import { csrfUtils } from 'src/shared/utils/csrf.util';

@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tenantService: TenantService,
    private readonly otpService: OtpService,
    private readonly userService: UserService,
  ) {}

  @Post('tenant-signup')
  @ApiOperation({ summary: 'Signup tenant and automated initial setup' })
  @ApiResponse({ status: 201, description: 'Signup process completed' })
  async tenantSignup(@Body() tenant: TenantSignupDto) {
    return await this.tenantService.tenantSignup(tenant);
  }

  @Post('user-signup')
  @ApiOperation({ summary: 'Signup or create a new account' })
  @ApiResponse({ status: 201, description: 'Signup process completed' })
  async userSignup(@Body() user: UserSignupDto) {
    return await this.userService.userSignup(user);
  }

  @Post('signin')
  @ApiOperation({ summary: 'Signin user and access token is generated' })
  @ApiResponse({ status: 200, description: 'Signin successfully' })
  async userSignin(@Body() user: SignIn, @Res({ passthrough: true }) response: Response) {
    const payload = await this.authService.signin(user);
    setCookie(payload.data!, response);
    return payload;
  }

  @Post('verify-email/send-otp')
  @ApiOperation({ summary: 'Send otp to the mail' })
  @ApiResponse({ status: 200, description: 'Otp sent successfully' })
  async sendOtp(@Body() payload: EmailDto) {
    return await this.otpService.sendOtp(payload.email);
  }

  @Post('verify-email/confirm')
  @ApiOperation({ summary: 'Verify the otp' })
  @ApiResponse({ status: 200, description: 'Otp verified successfully' })
  async emailVerifyOtp(@Body() data: OtpDto, @Res({ passthrough: true }) response: Response) {
    const payload = await this.otpService.emailVerifyOtp(data);
    setCookie(payload.data!, response);
    return payload;
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Update new password using current password' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }

  @Post('forgot-password/send-otp')
  @ApiOperation({ summary: 'Send otp to the mail' })
  @ApiResponse({ status: 200, description: 'Otp sent successfully' })
  async forgotPasswordSendOtp(@Body() payload: EmailDto) {
    return await this.otpService.sendOtp(payload.email);
  }

  @Post('forgot-password/confirm')
  @ApiOperation({ summary: 'Verify the otp' })
  @ApiResponse({ status: 200, description: 'Otp verified successfully' })
  async forgotPasswordVerifyOtp(@Body() otpDto: OtpDto) {
    return await this.otpService.forgotPasswordVerifyOtp(otpDto);
  }

  @Post('forgot-password/reset')
  @ApiOperation({ summary: 'Update new password using otp' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  async forgotPasswordReset(@Body() forgotPassword: ForgotPasswordDto) {
    return await this.authService.forgotPasswordReset(forgotPassword);
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: 'Update refresh token' })
  @ApiResponse({ status: 200, description: 'Token updated successfully' })
  async tokenRefresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<APIResponse> {
    const tokens = await this.authService.tokenRefresh(req);
    setCookie(tokens, res);
    return { success: true, statusCode: HttpStatus.OK, message: 'Token refreshed successfully' };
  }

  @Get('csrf-token')
  @Public()
  @ApiOperation({ summary: 'Get CSRF token' })
  @ApiResponse({ status: 200, description: 'CSRF token generated successfully' })
  async getCsrfToken(@Req() req: Request, @Res() res: Response): Promise<void> {
    const token = csrfUtils.generateCsrfToken(req, res);
    res.json({ csrfToken: token });
  }
}
