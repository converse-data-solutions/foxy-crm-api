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
import { TenantSignupDto } from 'src/dtos/tenant-dto/tenant-signup.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OtpService } from './otp.service';
import { CountryService } from './country.service';
import { SALT_ROUNDS } from 'src/shared/utils/config.util';
import { EmailService } from './email.service';
import { EmailDto } from 'src/dtos/otp-dto/otp.dto';

@Injectable()
export class TenantService {
  constructor(
    private readonly countryService: CountryService,
    private readonly emailService: EmailService,
    @Inject(forwardRef(() => OtpService))
    private readonly otpService: OtpService,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
  ) {}
  async tenantSetup(tenantData: { tenant: Tenant; token?: string }) {
    const { tenant, token } = tenantData;
    const schema = tenant.schemaName;

    const rootDataSource = await getConnection('public');
    const queryRunner = rootDataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
      await queryRunner.commitTransaction();
      const tenantDataSource = await getConnection(schema);
      await tenantDataSource.runMigrations();

      const userRepo = tenantDataSource.getRepository(User);
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
        refreshToken: token,
      });

      await userRepo.save(user);

      await this.sendEmail(user.name, user.email, true);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      await queryRunner.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);

      await this.sendEmail(tenant.userName, tenant.email, false);
      throw new InternalServerErrorException('Tenant setup failed. Please try again later.');
    } finally {
      await queryRunner.release();
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
      await this.emailService.sendMail(mailOptions);
    } catch (error: unknown) {
      throw new InternalServerErrorException(`Failed to send setup notification email.`);
    }
  }

  async tenantSignup(tenant: TenantSignupDto) {
    const domain = tenant.email.split('@')[1];

    const isTenant = await this.tenantRepo.findOne({
      where: [{ organizationName: tenant.organizationName }, { email: tenant.email }, { domain }],
    });
    if (isTenant) {
      if (isTenant.emailVerified) {
        throw new ConflictException(
          'An organization or email with this domain is already registered.',
        );
      }
      await this.otpService.sendOtp(isTenant.email);
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Please verify your email to continue.',
      };
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
        message: 'Signup successful. Please verify your email to continue.',
      };
    }
  }

  async getTenant(email: string) {
    const domain = email.split('@')[1];
    const dataSource = await getConnection('public');
    const queryRunner = dataSource.createQueryRunner();
    try {
      const schemas: { schema_name: string }[] | undefined = await queryRunner.query(`
      SELECT schema_name FROM information_schema.schemata;`);
      const tenant = await this.tenantRepo.findOne({
        where: { domain },
        relations: { subscription: true },
      });
      if (!tenant) {
        throw new BadRequestException('Please use your work email address.');
      }

      if (schemas && schemas.length > 0 && tenant.emailVerified) {
        const schemaExist = schemas.find((schema) => schema.schema_name === tenant.schemaName);
        if (!schemaExist) {
          const tenantData = { tenant };
          await this.tenantSetup(tenantData);
          throw new BadRequestException(
            'Basic setup is in progress. Please log in after receiving the setup completion email.',
          );
        }
      }
      return tenant;
    } finally {
      await queryRunner.release();
    }
  }
  async checkTenant(payload: EmailDto) {
    try {
      await this.getTenant(payload.email);
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Tenant status fetched for mail',
        tenantExists: true,
      };
    } catch (error) {
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Tenant status fetched for mail',
        tenantExists: false,
      };
    }
  }
}
