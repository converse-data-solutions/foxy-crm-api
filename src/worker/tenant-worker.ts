import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Tenant } from 'src/database/entity/base-app/tenant.entity';
import { User } from 'src/database/entity/core-app/user.entity';
import { basicSetupTemplate } from 'src/template/basic-setup.template';
import * as nodemailer from 'nodemailer';
import { HttpStatus } from '@nestjs/common';
import { getConnection, getRepo } from 'src/shared/database-connection/get-connection';
import { Role } from 'src/enum/core-app.enum';
import { CountryInterface } from 'src/interface/country.interface';
import { join } from 'path';
import * as fs from 'fs';
import { Country } from 'src/database/entity/common-entity/country.entity';
import { ILike } from 'typeorm';

@Processor('tenant-setup')
export class TenantWorker extends WorkerHost {
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
      this.sendOtpEmail(user);
    } catch (error) {
      console.log(error);
    }
  }

  private async sendOtpEmail(user: User) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.CLIENT_MAIL,
        pass: process.env.CLIENT_SECRET_MAIL,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    const htmlContent = basicSetupTemplate(user.name);
    const mailOptions = {
      from: process.env.CLIENT_MAIL,
      to: user.email,
      subject: 'Basic setup completed',
      html: htmlContent,
    };

    try {
      await transporter.sendMail(mailOptions);
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
