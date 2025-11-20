import { BadRequestException, forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { APIResponse, OTPFor } from 'src/common/dtos/response.dto';
import { TenantService } from './tenant.service';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { Tenant } from 'src/database/entities/base-app-entities/tenant.entity';
import { Repository } from 'typeorm';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { ForgotAndVerifyMail } from 'src/templates/forgot-and-verify-mail.template';
import { plainToInstance } from 'class-transformer';
import { JwtPayload } from 'src/common/dtos/jwt-payload.dto';
import { Role } from 'src/enums/core-app.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { OtpDto } from 'src/dtos/otp-dto/otp.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { Queue } from 'bullmq';
import { EmailTemplateType } from 'src/enums/email-teamplate.enum';
import { generateOtp } from 'src/shared/utils/generate-otp.util';
import { CookiePayload } from 'src/common/dtos/cookie-payload.dto';
import { TokenService } from './token.service';
import { EmailService } from './email.service';
import * as bcrypt from 'bcrypt';
import { SALT_ROUNDS } from 'src/shared/utils/config.util';

@Injectable()
export class OtpService {
  constructor(
    @Inject(forwardRef(() => TenantService))
    private readonly tenantService: TenantService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectQueue('tenant-setup') private readonly tenantQueue: Queue,
  ) {}
  async sendOtp(email: string): Promise<APIResponse> {
    const tenant = await this.tenantService.getTenant(email);
    let existUser: User | Tenant | null = null;
    let repo: Repository<Tenant | User> = this.tenantRepo;
    if (tenant.email === email && tenant.emailVerified === false) {
      existUser = tenant;
    } else {
      repo = await getRepo<User>(User, tenant.schemaName);
      existUser = await repo.findOne({ where: { email } });
    }
    if (!existUser) {
      throw new BadRequestException('Please provide a registered email address.');
    }
    existUser.otp = undefined;
    if (existUser instanceof User) {
      existUser.otpVerified = false;
    }
    const rawOtp = generateOtp();
    const expiryAt = new Date(Date.now() + 1.5 * 60 * 1000);
    const otp = bcrypt.hashSync(rawOtp, SALT_ROUNDS);
    existUser.otp = otp;
    existUser.otpExpiryAt = expiryAt;
    await repo.save(existUser);
    const name = existUser instanceof User ? existUser.name : existUser.userName;

    let emailType = EmailTemplateType.EmailVerify;
    let subject = 'Your One-Time Password (OTP) for Email Verification';
    if (existUser.emailVerified) {
      emailType = EmailTemplateType.ForgotPassword;
      subject = 'Your One-Time Password (OTP) for Password Reset';
    }
    const html = ForgotAndVerifyMail(name, rawOtp, emailType);
    await this.emailService.sendMail({
      to: existUser.email,
      html,
      subject,
    });

    return { success: true, statusCode: HttpStatus.OK, message: 'Otp successfully sent to email' };
  }

  async emailVerifyOtp(otpDto: OtpDto): Promise<APIResponse<CookiePayload>> {
    const tenant = await this.tenantService.getTenant(otpDto.email);
    let repo: Repository<Tenant | User> = this.tenantRepo;
    let userExist: User | Tenant | null = null;

    if (tenant.email === otpDto.email) {
      userExist = tenant;
    } else {
      repo = await getRepo<User>(User, tenant.schemaName);
      userExist = await repo.findOne({ where: { email: otpDto.email } });
    }
    if (!userExist) {
      throw new BadRequestException('Invalid or unregistered email address.');
    }
    if (userExist.otpExpiryAt && userExist.otpExpiryAt < new Date()) {
      throw new BadRequestException('OTP has expired. Please resend and verify again.');
    }
    if (userExist.otp && bcrypt.compareSync(otpDto.otp.toString(), userExist.otp) === false) {
      throw new BadRequestException('Invalid or incorrect OTP.');
    }
    if (userExist.emailVerified) {
      throw new BadRequestException('Email has already been verified.');
    }

    const payload = plainToInstance(JwtPayload, userExist, {
      excludeExtraneousValues: true,
    });

    const accessToken = this.tokenService.generateAccessToken({ ...payload });
    const refreshToken = this.tokenService.generateRefreshToken({ ...payload });
    const hashedToken = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    userExist.emailVerified = true;

    await repo.save(userExist);
    let otpFor: OTPFor;
    if (userExist instanceof Tenant) {
      const subscription = this.subscriptionRepo.create({
        tenant: userExist,
      });
      await this.subscriptionRepo.save(subscription);

      await this.tenantQueue.add('tenant-setup', {
        tenant: userExist,
        token: hashedToken,
      });
      otpFor = 'tenantSignup';
    } else {
      otpFor = 'userSignup';
    }
    const role = userExist instanceof Tenant ? Role.SuperAdmin : userExist.role;
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Email verified successfully',
      data: { accessToken, refreshToken, role, xTenantId: tenant.schemaName },
      otpFor,
    };
  }

  async forgotPasswordVerifyOtp(otpDto: OtpDto): Promise<APIResponse<OTPFor>> {
    const tenant = await this.tenantService.getTenant(otpDto.email);
    const userRepo = await getRepo(User, tenant.schemaName);
    const userExist = await userRepo.findOne({ where: { email: otpDto.email } });
    if (!userExist) {
      throw new BadRequestException('Invalid or unregistered email address.');
    }
    if (userExist.otpExpiryAt && userExist.otpExpiryAt < new Date()) {
      throw new BadRequestException('OTP has expired. Please resend and verify again.');
    }
    if (userExist.otp && bcrypt.compareSync(otpDto.otp.toString(), userExist.otp) === false) {
      throw new BadRequestException('Invalid or incorrect OTP.');
    }
    userExist.otpVerified = true;
    await userRepo.save(userExist);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Otp verified successfully',
      otpFor: 'forgotPassword',
    };
  }
}
