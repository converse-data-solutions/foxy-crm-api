import { BullModule } from '@nestjs/bullmq';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpService } from 'src/services/otp.service';
import { TenantModule } from './tenant.module';
import { entities } from 'src/database/entities/base-app-entities';
import { TokenModule } from './token.module';
import { EmailModule } from './email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature(entities),
    EmailModule,
    BullModule.registerQueue({ name: 'tenant-setup' }),
    TokenModule,
    forwardRef(() => TenantModule),
  ],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
