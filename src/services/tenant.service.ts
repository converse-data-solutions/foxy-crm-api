import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Tenant } from 'src/database/entity/base-app/tenant.entity';
import { getConnection, getRepo } from 'src/shared/database-connection/get-connection';
import { SeedService } from './seed.service';
import { Country } from 'src/database/entity/common-entity/country.entity';
import { Like } from 'typeorm';
import { User } from 'src/database/entity/core-app/user.entity';
import { Role } from 'src/enums/core-app.enum';
import { basicSetupSuccessTemplate } from 'src/templates/basic-setup-success.template';
import { basicSetupFailureTemplate } from 'src/templates/basic-setup-failure.template';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class TenantService {
  constructor(
    private readonly seedService: SeedService,
    private readonly mailService: MailerService,
  ) {}
  async tenantSetup(tenantData: { tenant: Tenant; country: string }) {
    const { tenant, country } = tenantData;
    const schema = tenant.schemaName;
    const dataSource = await getConnection(schema);
    try {
      await dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
      await dataSource.query(`SET search_path TO "${schema}"`);
      await dataSource.runMigrations();
      await this.seedService.countrySeed(schema);
      const countryRepo = await getRepo<Country>(Country, tenant.schemaName);
      let userCountry: Country | null = null;
      if (country) {
        userCountry = await countryRepo.findOne({ where: { name: Like(`%${country}%`) } });
      }
      const userRepo = dataSource.getRepository(User);
      const user = userRepo.create({
        name: tenant.userName,
        password: tenant.password,
        phone: tenant.phone,
        country: userCountry ? userCountry : undefined,
        address: tenant.address,
        isVerified: true,
        city: tenant.city,
        role: Role.Admin,
        email: tenant.email,
      });
      await userRepo.save(user);
      await this.sendOtpEmail(user.name, user.email, true);
    } catch (error) {
      await this.sendOtpEmail(tenant.userName, tenant.email, false);
    }
  }

  private async sendOtpEmail(name: string, email: string, flag: boolean) {
    const htmlContent = flag ? basicSetupSuccessTemplate(name) : basicSetupFailureTemplate(name);
    const mailOptions = {
      to: email,
      subject: flag ? 'Basic setup completed' : 'Basic setup failed',
      html: htmlContent,
    };
    try {
      await this.mailService.sendMail(mailOptions);
    } catch (error: unknown) {
      throw new InternalServerErrorException({
        message: `Error occured while sending mail ${error}`,
      });
    }
  }
}
