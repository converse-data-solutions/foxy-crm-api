import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Subscription } from 'src/database/entity/base-app/subscription.entity';
import { Tenant } from 'src/database/entity/base-app/tenant.entity';
import { TenantSignupDto } from 'src/dto/tenant-dto/tenant-signup.dto';
import { ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Signin, UserSignupDto } from 'src/dto/user-dto/user-signup.dto';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { User } from 'src/database/entity/core-app/user.entity';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/common/dtos/jwt-payload.dto';
import { plainToInstance } from 'class-transformer';
import { Country } from 'src/database/entity/common-entity/country.entity';
import { emailVerifyTemplate } from 'src/templates/email-verify.template';
import { MailerService } from '@nestjs-modules/mailer';
import { APIResponse } from 'src/common/dtos/response.dto';
import { OtpDto } from 'src/dto/otp-dto/otp.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Country) private readonly countryRepo: Repository<Country>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectQueue('tenant-setup') private readonly tenantQueue: Queue,
    private readonly jwtService: JwtService,
    private readonly mailService: MailerService,
  ) {}

  async tenantSignup(tenant: TenantSignupDto) {
    const domain = tenant.email.split('@')[1].split('.')[0];

    const isTenant = await this.tenantRepo.findOne({
      where: [{ organizationName: tenant.organizationName }, { email: tenant.email }, { domain }],
    });
    if (isTenant != null) {
      throw new ConflictException({
        message: 'The Organization or email with this domain is already registered',
      });
    } else {
      const hashPassword = await bcrypt.hash(tenant.password, Number(process.env.SALT));
      const { country, ...tenantData } = tenant;
      let tenantCountry: Country | null = null;
      if (country) {
        tenantCountry = await this.countryRepo.findOne({
          where: { name: ILike(`%${country}%`) },
        });
        if (!tenantCountry) {
          throw new NotFoundException({ message: 'Country not found or invalid country' });
        }
      }
      await this.tenantRepo.save({
        ...tenantData,
        domain,
        country: tenantCountry ? tenantCountry : undefined,
        password: hashPassword,
      });

      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        message: 'Signup successfull please verify the mail',
      };
    }
  }

  async userSignup(user: UserSignupDto) {
    const tenant = await this.getTenantId(user.email);
    const userRepo = await getRepo<User>(User, tenant.schemaName);
    const countryRepo = await getRepo<Country>(Country, tenant.schemaName);
    const isUser = await userRepo.findOne({
      where: [{ email: user.email }, { phone: user.phone }],
    });
    if (isUser) {
      throw new ConflictException({
        message: 'User with this email or phone number is already registered',
      });
    } else {
      let country: Country | null = null;
      if (user.country) {
        country = await countryRepo.findOne({ where: { name: ILike(`%${user.country}%`) } });
      }
      const hashPassword = await bcrypt.hash(user.password, Number(process.env.SALT || 5));
      const newUser = userRepo.create({
        name: user.name,
        password: hashPassword,
        email: user.email,
        phone: user.phone,
        country: country ? country : undefined,
      });
      await userRepo.save(newUser);
      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        message: 'User account created successfully',
      };
    }
  }

  async userSignin(user: Signin) {
    const tenant = await this.getTenantId(user.email);
    let tenantAccessToken: string | null = null;
    if (tenant.email === user.email) {
      if (!tenant.isVerified) {
        throw new BadRequestException({ message: 'Please verify the email then login' });
      }
      tenantAccessToken = this.jwtService.sign(
        { id: tenant.id, email: tenant.email },
        { secret: process.env.SECRET_KEY },
      );
    }
    let repo = await getRepo(User, tenant.schemaName);

    const userExist = await repo.findOne({ where: { email: user.email } });
    if (!userExist) {
      throw new NotFoundException({
        message: 'User email not found please signup',
      });
    } else {
      const validPassword = await bcrypt.compare(user.password, userExist.password);
      if (!validPassword) {
        throw new BadRequestException({
          message: 'Invalid password please enter correct password',
        });
      } else {
        if (!userExist.isVerified) {
          throw new BadRequestException({ message: 'Please verify the email then login' });
        }
        const payload = plainToInstance(JwtPayload, userExist, {
          excludeExtraneousValues: true,
        });

        const accessToken = this.jwtService.sign(
          {
            ...payload,
          },
          { secret: process.env.SECRET_KEY },
        );
        return { tenantAccessToken, accessToken };
      }
    }
  }

  async sendOtp(email: string): Promise<APIResponse> {
    const tenant = await this.getTenantId(email);
    let existUser: User | Tenant | null = null;
    let repo: Repository<Tenant | User> = this.tenantRepo;
    if (tenant.email === email) {
      existUser = tenant;
    } else {
      repo = await getRepo<User>(User, tenant.schemaName);
      existUser = await repo.findOne({ where: { email } });
    }
    if (!existUser) {
      throw new BadRequestException({ message: 'Please provide registered email address' });
    }
    const otp = this.generateOtp();
    const expiryAt = new Date(Date.now() + 2 * 60 * 1000);
    existUser.otp = Number(otp);
    existUser.otpExpiryAt = expiryAt;
    existUser.isVerified = true;
    await repo.save(existUser);
    const name = existUser instanceof User ? existUser.name : existUser.userName;
    const html = emailVerifyTemplate(name, otp);
    this.mailService.sendMail({
      to: existUser.email,
      html,
      subject: 'Your One-Time Password (OTP) for Verification',
    });

    return { success: true, statusCode: HttpStatus.OK, message: 'Otp successfully sent to email' };
  }

  async verifyOtp(otpDto: OtpDto) {
    const tenant = await this.getTenantId(otpDto.email);
    let repo: Repository<Tenant | User> = this.tenantRepo;
    let userExist: User | Tenant | null = null;
    if (tenant.email === otpDto.email) {
      userExist = tenant;
    } else {
      repo = await getRepo<User>(User, tenant.schemaName);
      userExist = await repo.findOne({ where: { email: otpDto.email } });
    }
    if (!userExist) {
      throw new BadRequestException({ message: 'Invalid email address or email not found' });
    }
    if (userExist.otpExpiryAt && userExist.otpExpiryAt < new Date()) {
      throw new BadRequestException({ message: 'Otp expired please click resend and verify' });
    }
    if (userExist.otp && userExist.otp !== otpDto.otp) {
      throw new BadRequestException({ message: 'Invalid or wrong otp' });
    }
    if (userExist instanceof Tenant) {
      const subscription = this.subscriptionRepo.create({
        tenant: userExist,
      });
      await this.subscriptionRepo.save(subscription);

      await this.tenantQueue.add('tenant-setup', {
        tenant: userExist,
        country: tenant.country,
      });
    }
    return { success: true, statusCode: HttpStatus.OK, message: 'Email verified successfully' };
  }

  async validateUser(payload: JwtPayload, schema: string) {
    const subscriptionExist = await this.subscriptionRepo.findOne({
      where: { tenant: { schemaName: schema } },
      relations: { tenant: true },
    });
    if (!subscriptionExist) {
      throw new BadRequestException({ message: 'Invalid schema name' });
    }
    if (subscriptionExist.status === false && process.env.DEVELOPMENT == 'prod') {
      throw new BadRequestException({ message: 'Subscription got expired please subscribe' });
    }

    const userRepo = await getRepo(User, schema);
    const user = await userRepo.findOne({ where: { id: payload.id } });
    return user ? user : null;
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async getTenantId(email: string) {
    const domain = email.split('@')[1].split('.')[0];
    const domainExist = await this.tenantRepo.findOne({
      where: { domain },
      relations: { country: true },
    });
    if (!domainExist) {
      throw new BadRequestException({ message: 'Please provide registered email address' });
    }
    return domainExist;
  }
}
