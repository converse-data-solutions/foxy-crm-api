import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Tenant } from 'src/database/entity/base-app/tenant.entity';
import { User } from 'src/database/entity/core-app/user.entity';
import { basicSetupTemplate } from 'src/template/basic-setup.template';
import * as nodemailer from 'nodemailer';
import { HttpStatus } from '@nestjs/common';
import { getConnection } from 'src/shared/database-connection/get-connection';
import { Role } from 'src/enum/core-app.enum';

@Processor('tenant-setup')
export class TenantWorker extends WorkerHost {
  async process(job: Job) {
    await this.tenantSetup(job.data);
  }

  async tenantSetup(tenantData: Tenant) {
    const schema = tenantData.schemaName;
    const dataSource = await getConnection(schema);
    try {
      await dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
      await dataSource.query(`SET search_path TO "${schema}"`);
      await dataSource.runMigrations();
      const userRepo = dataSource.getRepository(User);
      const user = userRepo.create({
        name: tenantData.userName,
        password: tenantData.password,
        role: Role.Admin,
        email: tenantData.email,
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
}
