import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { SignIn } from 'src/dtos/user-dto/user-signup.dto';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { JwtPayload } from 'src/common/dtos/jwt-payload.dto';
import { plainToInstance } from 'class-transformer';
import { TenantService } from './tenant.service';
import { ForgotPasswordDto, ResetPasswordDto } from 'src/dtos/password-dto/reset-password.dto';
import { APIResponse } from 'src/common/dtos/response.dto';
import { SALT_ROUNDS } from 'src/shared/utils/config.util';
import { CookiePayload } from 'src/common/dtos/cookie-payload.dto';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly tenantService: TenantService,
  ) {}

  async signin(user: SignIn): Promise<APIResponse<CookiePayload>> {
    const tenant = await this.tenantService.getTenant(user.email);
    let tenantAccessToken: string | null = null;
    if (tenant.email === user.email) {
      if (!tenant.emailVerified) {
        throw new BadRequestException('Please verify the email then login');
      }
      tenantAccessToken = this.tokenService.generateAccessToken({
        id: tenant.id,
        email: tenant.email,
      });
    }
    let repo = await getRepo(User, tenant.schemaName);

    const userExist = await repo.findOne({ where: { email: user.email } });
    if (!userExist) {
      throw new NotFoundException('User email not found please signup');
    } else {
      const validPassword = await bcrypt.compare(user.password, userExist.password);
      if (!validPassword) {
        throw new BadRequestException('Invalid password please enter correct password');
      } else {
        if (!userExist.status) {
          throw new BadRequestException('Your account is disabled please contact the admin');
        }
        if (!userExist.emailVerified) {
          throw new BadRequestException('Please verify the email then login');
        }
        const payload = plainToInstance(JwtPayload, userExist, {
          excludeExtraneousValues: true,
        });

        const accessToken = this.tokenService.generateAccessToken({ ...payload });
        return {
          success: true,
          statusCode: HttpStatus.OK,
          message: 'Signin successfull',
          data: {
            tenantAccessToken,
            accessToken,
            role: userExist.role,
            xTenantId: tenant.schemaName,
          },
        };
      }
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const tenant = await this.tenantService.getTenant(resetPasswordDto.email);
    const userRepo = await getRepo(User, tenant.schemaName);
    const userExist = await userRepo.findOne({ where: { email: resetPasswordDto.email } });
    if (!userExist) {
      throw new NotFoundException('User not found or invalid email');
    }
    if (resetPasswordDto.password === resetPasswordDto.newPassword) {
      throw new BadRequestException('Old password and current password should not be same');
    }
    const validPassword = await bcrypt.compare(resetPasswordDto.password, userExist.password);
    if (!validPassword) {
      throw new BadRequestException('Invalid password please enter correct password');
    }
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, SALT_ROUNDS);
    userExist.password = hashedPassword;
    await userRepo.save(userExist);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Password updated successfully',
    };
  }

  async forgotPasswordReset(forgotPassword: ForgotPasswordDto): Promise<APIResponse> {
    const tenant = await this.tenantService.getTenant(forgotPassword.email);
    const userRepo = await getRepo(User, tenant.schemaName);
    const userExist = await userRepo.findOne({ where: { email: forgotPassword.email } });
    if (!userExist) {
      throw new NotFoundException('User not found or invalid email');
    }
    if (!userExist.otpVerified) {
      throw new BadRequestException('Otp is not verified please verify otp and reset the password');
    }
    const isExistingPassword = await bcrypt.compare(forgotPassword.password, userExist.password);
    if (isExistingPassword) {
      throw new BadRequestException('Old password and current password should not be same');
    }
    const hashedPassword = await bcrypt.hash(forgotPassword.password, SALT_ROUNDS);
    userExist.password = hashedPassword;
    userExist.otpVerified = false;
    await userRepo.save(userExist);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Password updated successfully',
    };
  }
}
