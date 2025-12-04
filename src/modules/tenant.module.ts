import { forwardRef, Module } from '@nestjs/common';
import { TenantService } from '../services/tenant.service';
import { SeedModule } from './seed.module';
import { TenantProcessor } from 'src/processors/tenant.processor';
import { Tenant } from 'src/database/entities/base-app-entities/tenant.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpModule } from './otp.module';
import { CountryModule } from './country.module';
import { EmailModule } from './email.module';

@Module({
  imports: [
    SeedModule,
    TypeOrmModule.forFeature([Tenant]),
    forwardRef(() => OtpModule),
    EmailModule,
    CountryModule,
  ],
  providers: [TenantService, TenantProcessor],
  exports: [TenantService, TenantProcessor],
})
export class TenantModule {}
