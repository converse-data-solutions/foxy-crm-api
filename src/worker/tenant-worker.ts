import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Tenant } from 'src/database/entity/base-app/tenant.entity';
import { User } from 'src/database/entity/core-app/user.entity';
import { HttpStatus } from '@nestjs/common';
import { getConnection, getRepo } from 'src/shared/database-connection/get-connection';
import { Role } from 'src/enum/core-app.enum';
import { CountryInterface } from 'src/interface/country.interface';
import { join } from 'path';
import * as fs from 'fs';
import { Country } from 'src/database/entity/common-entity/country.entity';
import { ILike } from 'typeorm';
import { basicSetupSuccessTemplate } from 'src/template/basic-setup-success.template';
import { basicSetupFailureTemplate } from 'src/template/basic-setup-failure.template';
import { MailerService } from '@nestjs-modules/mailer';

@Processor('tenant-setup')
export class TenantWorker extends WorkerHost {
  constructor(private readonly mailService: MailerService) {
    super();
  }
  private countries: CountryInterface[] = [];
  async process(job: Job) {
    await this.tenantSetup(job.data);
  }

  async tenantSetup(tenantData: { tenant: Tenant; country: string }) {
    const { tenant, country } = tenantData;
    const schema = tenant.schemaName;
    const dataSource = await getConnection(schema);
    try {
      await dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
      await dataSource.query(`SET search_path TO "${schema}"`);
      await dataSource.runMigrations();
      await this.countrySeed(schema);
      const countryRepo = await getRepo<Country>(Country, tenant.schemaName);
      let userCountry: Country | null = null;
      if (country) {
        userCountry = await countryRepo.findOne({ where: { name: ILike(`%${country}%`) } });
      }
      const userRepo = dataSource.getRepository(User);
      const user = userRepo.create({
        name: tenant.userName,
        password: tenant.password,
        phone: tenant.phone,
        country: userCountry ? userCountry : undefined,
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
    } catch (error) {
      console.log({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      });
    }
  }

  async countrySeed(schema: string) {
    const filePath = join(process.cwd(), 'src/asset/country-mock-data.json');
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }
    const rawData = fs.readFileSync(filePath, 'utf-8');
    this.countries = JSON.parse(rawData);
    const countryRepo = await getRepo(Country, schema);
    const existingCountries = await countryRepo.find();
    if (existingCountries.length == 0) {
      for (const country of this.countries) {
        const newcCountries = countryRepo.create({
          name: country.name,
          isoCode2: country.iso_code_2,
          isoCode3: country.iso_code_3,
          phoneCode: country.phone_code,
          flagImage: country.country_flag,
          isActive: country.is_active ?? true,
        });
        await countryRepo.save(newcCountries);
      }
    }
  }
}
