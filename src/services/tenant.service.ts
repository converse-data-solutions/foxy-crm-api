import {
  BadRequestException,
  ConflictException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Tenant } from 'src/database/entities/base-app-entities/tenant.entity';
import { getConnection } from 'src/shared/database-connection/get-connection';
import { Repository } from 'typeorm';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { Role } from 'src/enums/core-app.enum';
import { basicSetupSuccessTemplate } from 'src/templates/basic-setup-success.template';
import { basicSetupFailureTemplate } from 'src/templates/basic-setup-failure.template';
import { MailerService } from '@nestjs-modules/mailer';
import { TenantSignupDto } from 'src/dtos/tenant-dto/tenant-signup.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OtpService } from './otp.service';
import { CountryService } from './country.service';
import { SALT_ROUNDS } from 'src/common/constant/config.constants';

@Injectable()
export class TenantService {
  constructor(
    private readonly countryService: CountryService,
    private readonly mailService: MailerService,
    @Inject(forwardRef(() => OtpService))
    private readonly otpService: OtpService,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
  ) {}
  async tenantSetup(tenantData: { tenant: Tenant }) {
    const { tenant } = tenantData;
    const schema = tenant.schemaName;
    const dataSource = await getConnection(schema);
    try {
      await dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
      await dataSource.query(`SET search_path TO "${schema}"`);
      await dataSource.runMigrations();
      const userRepo = dataSource.getRepository(User);
      const user = userRepo.create({
        name: tenant.userName,
        password: tenant.password,
        phone: tenant.phone,
        country: tenant.country,
        address: tenant.address,
        emailVerified: true,
        city: tenant.city,
        role: Role.Admin,
        email: tenant.email,
      });
      await userRepo.save(user);
      await this.sendEmail(user.name, user.email, true);
    } catch (error) {
      await this.sendEmail(tenant.userName, tenant.email, false);
    }
  }

  private async sendEmail(name: string, email: string, flag: boolean) {
    const htmlContent = flag ? basicSetupSuccessTemplate(name) : basicSetupFailureTemplate(name);
    const mailOptions = {
      to: email,
      subject: flag ? 'Basic setup completed' : 'Basic setup failed',
      html: htmlContent,
    };
    try {
      await this.mailService.sendMail(mailOptions);
    } catch (error: unknown) {
      throw new InternalServerErrorException(`Error occured while sending mail ${error}`);
    }
  }

  async tenantSignup(tenant: TenantSignupDto) {
    const domain = tenant.email.split('@')[1].split('.')[0];

    const isTenant = await this.tenantRepo.findOne({
      where: [{ organizationName: tenant.organizationName }, { email: tenant.email }, { domain }],
    });
    if (isTenant != null) {
      throw new ConflictException(
        'The Organization or email with this domain is already registered',
      );
    } else {
      const hashPassword = await bcrypt.hash(tenant.password, SALT_ROUNDS);
      const { country, ...tenantData } = tenant;
      let tenantCountry: string | undefined;
      if (country) {
        tenantCountry = this.countryService.getCountry(country);
      }
      await this.tenantRepo.save({
        ...tenantData,
        domain,
        country: tenantCountry,
        password: hashPassword,
      });
      await this.otpService.sendOtp(tenant.email);
      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        message: 'Signup successfull please verify the mail',
      };
    }
  }

  async getTenant(email: string) {
    const domain = email.split('@')[1].split('.')[0];
    const domainExist = await this.tenantRepo.findOne({
      where: { domain },
      relations: { subscription: true },
    });
    if (!domainExist) {
      throw new BadRequestException('Please provide registered email address');
    }
    return domainExist;
  }
}
