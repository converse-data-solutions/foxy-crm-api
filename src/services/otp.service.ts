import { BadRequestException, forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
<<<<<<< HEAD
import { APIResponse, OTPFor } from 'src/common/dtos/response.dto';
=======
import { APIResponse } from 'src/common/dtos/response.dto';
>>>>>>> da3c435 (reset-password)
import { TenantService } from './tenant.service';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { Tenant } from 'src/database/entities/base-app-entities/tenant.entity';
import { Repository } from 'typeorm';
import { getRepo } from 'src/shared/database-connection/get-connection';
<<<<<<< HEAD
=======
import { generateOtp } from 'src/shared/functions/generate-otp';
>>>>>>> da3c435 (reset-password)
import { ForgotAndVerifyMail } from 'src/templates/forgot-and-verify-mail.template';
import { plainToInstance } from 'class-transformer';
import { JwtPayload } from 'src/common/dtos/jwt-payload.dto';
import { Role } from 'src/enums/core-app.enum';
import { InjectRepository } from '@nestjs/typeorm';
<<<<<<< HEAD
import { OtpDto } from 'src/dtos/otp-dto/otp.dto';
=======
import { MailerService } from '@nestjs-modules/mailer';
import { OtpDto } from 'src/dtos/otp-dto/otp.dto';
import { JwtService } from '@nestjs/jwt';
>>>>>>> da3c435 (reset-password)
import { InjectQueue } from '@nestjs/bullmq';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { Queue } from 'bullmq';
import { EmailTemplateType } from 'src/enums/email-teamplate.enum';
<<<<<<< HEAD
import { generateOtp } from 'src/shared/utils/generate-otp.util';
import { CookiePayload } from 'src/common/dtos/cookie-payload.dto';
import { TokenService } from './token.service';
import { EmailService } from './email.service';
import * as bcrypt from 'bcrypt';
import { SALT_ROUNDS } from 'src/shared/utils/config.util';
=======
>>>>>>> da3c435 (reset-password)

@Injectable()
export class OtpService {
  constructor(
    @Inject(forwardRef(() => TenantService))
    private readonly tenantService: TenantService,
<<<<<<< HEAD
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
=======
    private readonly jwtService: JwtService,
    private readonly mailService: MailerService,
>>>>>>> da3c435 (reset-password)
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
<<<<<<< HEAD
      throw new BadRequestException('Please provide registered email address');
=======
      throw new BadRequestException({ message: 'Please provide registered email address' });
>>>>>>> da3c435 (reset-password)
    }
    const otp = generateOtp();
    const expiryAt = new Date(Date.now() + 1.5 * 60 * 1000);
    existUser.otp = Number(otp);
    existUser.otpExpiryAt = expiryAt;
    await repo.save(existUser);
    const name = existUser instanceof User ? existUser.name : existUser.userName;

    let emailType = EmailTemplateType.EmailVerify;
    let subject = 'Your One-Time Password (OTP) for Email Verification';
    if (existUser.emailVerified) {
      emailType = EmailTemplateType.ForgotPassword;
      subject = 'Your One-Time Password (OTP) for Password Reset';
    }
    const html = ForgotAndVerifyMail(name, otp, emailType);
<<<<<<< HEAD
    await this.emailService.sendMail({
=======
    this.mailService.sendMail({
>>>>>>> da3c435 (reset-password)
      to: existUser.email,
      html,
      subject,
    });

    return { success: true, statusCode: HttpStatus.OK, message: 'Otp successfully sent to email' };
  }

<<<<<<< HEAD
  async emailVerifyOtp(otpDto: OtpDto): Promise<APIResponse<CookiePayload>> {
    const tenant = await this.tenantService.getTenant(otpDto.email);
    let repo: Repository<Tenant | User> = this.tenantRepo;
    let userExist: User | Tenant | null = null;

    if (tenant.email === otpDto.email) {
      userExist = tenant;
=======
  async emailVerifyOtp(otpDto: OtpDto) {
    const tenant = await this.tenantService.getTenant(otpDto.email);
    let repo: Repository<Tenant | User> = this.tenantRepo;
    let tenantAccessToken: string | null = null;
    let userExist: User | Tenant | null = null;
    if (tenant.email === otpDto.email) {
      userExist = tenant;
      tenantAccessToken = this.jwtService.sign(
        { id: tenant.id, email: tenant.email },
        { secret: process.env.SECRET_KEY },
      );
>>>>>>> da3c435 (reset-password)
    } else {
      repo = await getRepo<User>(User, tenant.schemaName);
      userExist = await repo.findOne({ where: { email: otpDto.email } });
    }
    if (!userExist) {
<<<<<<< HEAD
      throw new BadRequestException('Invalid email address or email not found');
    }
    if (userExist.otpExpiryAt && userExist.otpExpiryAt < new Date()) {
      throw new BadRequestException('Otp expired please click resend and verify');
    }
    if (userExist.otp && userExist.otp !== otpDto.otp) {
      throw new BadRequestException('Invalid or wrong otp');
    }
    if (userExist.emailVerified) {
      throw new BadRequestException('Email is already verified');
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
=======
      throw new BadRequestException({ message: 'Invalid email address or email not found' });
    }
    if (userExist.otpExpiryAt && userExist.otpExpiryAt < new Date()) {
      throw new BadRequestException({ message: 'Otp expired please click resend and verify' });
    }
    if (userExist.otp && userExist.otp !== otpDto.otp) {
      throw new BadRequestException({ message: 'Invalid or wrong otp' });
    }
    if (userExist.emailVerified) {
      throw new BadRequestException({ message: 'Email is already verified' });
    }

    let accessToken: string | null = null;
    userExist.emailVerified = true;
    await repo.save(userExist);
>>>>>>> da3c435 (reset-password)
    if (userExist instanceof Tenant) {
      const subscription = this.subscriptionRepo.create({
        tenant: userExist,
      });
      await this.subscriptionRepo.save(subscription);

      await this.tenantQueue.add('tenant-setup', {
        tenant: userExist,
<<<<<<< HEAD
        token: hashedToken,
      });
      otpFor = 'tenantSignup';
    } else {
      otpFor = 'userSignup';
    }

    const role = userExist instanceof Tenant ? Role.Admin : userExist.role;
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Email verified successfully',
      data: { accessToken, refreshToken, role, xTenantId: tenant.schemaName },
      otpFor,
    };
  }

  async forgotPasswordVerifyOtp(otpDto: OtpDto): Promise<APIResponse<OTPFor>> {
=======
      });
    }
    const payload = plainToInstance(JwtPayload, userExist, {
      excludeExtraneousValues: true,
    });
    accessToken = tenantAccessToken
      ? null
      : this.jwtService.sign(
          {
            ...payload,
          },
          { secret: process.env.SECRET_KEY },
        );
    const role = userExist instanceof Tenant ? Role.Admin : userExist.role;
    return { tenantAccessToken, accessToken, role, xTenantId: tenant.schemaName };
  }

  async forgotPasswordVerifyOtp(otpDto: OtpDto): Promise<APIResponse> {
>>>>>>> da3c435 (reset-password)
    const tenant = await this.tenantService.getTenant(otpDto.email);
    const userRepo = await getRepo(User, tenant.schemaName);
    const userExist = await userRepo.findOne({ where: { email: otpDto.email } });
    if (!userExist) {
<<<<<<< HEAD
      throw new BadRequestException('Invalid email address or email not found');
    }
    if (userExist.otpExpiryAt && userExist.otpExpiryAt < new Date()) {
      throw new BadRequestException('Otp expired please click resend and verify');
    }
    if (userExist.otp && userExist.otp !== otpDto.otp) {
      throw new BadRequestException('Invalid or wrong otp');
=======
      throw new BadRequestException({ message: 'Invalid email address or email not found' });
    }
    if (userExist.otpExpiryAt && userExist.otpExpiryAt < new Date()) {
      throw new BadRequestException({ message: 'Otp expired please click resend and verify' });
    }
    if (userExist.otp && userExist.otp !== otpDto.otp) {
      throw new BadRequestException({ message: 'Invalid or wrong otp' });
>>>>>>> da3c435 (reset-password)
    }
    userExist.otpVerified = true;
    await userRepo.save(userExist);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Otp verified successfully',
<<<<<<< HEAD
      otpFor: 'forgotPassword',
=======
>>>>>>> da3c435 (reset-password)
    };
  }
}
