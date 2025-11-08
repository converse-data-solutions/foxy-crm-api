import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
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
import { Request, Response } from 'express';
import { csrfUtils } from 'src/shared/utils/csrf.util';
import { LoggerService } from 'src/common/logger/logger.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly tenantService: TenantService,
    private readonly loggerService: LoggerService,
  ) {}

  async signin(user: SignIn): Promise<APIResponse<CookiePayload>> {
    const tenant = await this.tenantService.getTenant(user.email);
    const repo = await getRepo(User, tenant.schemaName);

    const userExist = await repo.findOne({ where: { email: user.email } });
    if (!userExist) {
      throw new NotFoundException('User not found. Please sign up first.');
    } else {
      const validPassword = await bcrypt.compare(user.password, userExist.password);
      if (!validPassword) {
        throw new BadRequestException('Incorrect password. Please try again.');
      } else {
        if (!userExist.status) {
          throw new BadRequestException('Your account is disabled. Please contact the admin.');
        }
        if (!userExist.emailVerified) {
          throw new BadRequestException('Please verify your email before signing in.');
        }
        const payload = plainToInstance(JwtPayload, userExist, {
          excludeExtraneousValues: true,
        });

        const accessToken = this.tokenService.generateAccessToken({ ...payload });
        const refreshToken = this.tokenService.generateRefreshToken({ ...payload });
        const hashedToken = await bcrypt.hash(refreshToken, SALT_ROUNDS);
        userExist.refreshToken = hashedToken;
        await repo.save(userExist);
        return {
          success: true,
          statusCode: HttpStatus.OK,
          message: 'Signin successfull',
          data: {
            accessToken,
            refreshToken,
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
      throw new BadRequestException('New password cannot be the same as the old password.');
    }
    const validPassword = await bcrypt.compare(resetPasswordDto.password, userExist.password);
    if (!validPassword) {
      throw new BadRequestException('Invalid current password.');
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
      throw new BadRequestException(
        'OTP not verified. Please verify OTP before resetting password.',
      );
    }
    const isExistingPassword = await bcrypt.compare(forgotPassword.password, userExist.password);
    if (isExistingPassword) {
      throw new BadRequestException('New password cannot be the same as the old password.');
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

  async tokenRefresh(req: Request) {
    const token: string | undefined = req?.cookies['refresh_token'];
    if (!token) {
      throw new UnauthorizedException('Missing refresh token.');
    }
    const updatedToken = await this.tokenService.getRefreshToken(token);
    return updatedToken;
  }

  async getCsrfToken(req: Request, res: Response) {
    try {
      const accessToken: string | undefined = req?.cookies['access_token'];
      if (!accessToken) {
        throw new UnauthorizedException('Access token not found');
      }
      const payload = await this.tokenService.verifyAccessToken(accessToken);
      req.user = payload;
      res.clearCookie('x-csrf-secret', { path: '/' });
      const token = csrfUtils.generateCsrfToken(req, res, {
        overwrite: true,
      });
      res.json({
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Csrf token fetched successfully',
        data: { csrfToken: token },
      });
    } catch (err) {
      this.loggerService.logError(`CSRF token generation failed: ${err.message}`);
      throw new InternalServerErrorException(
        'Unable to generate CSRF token. Please try again later.',
      );
    }
  }
}
