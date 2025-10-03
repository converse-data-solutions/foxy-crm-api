import { BullModule } from '@nestjs/bullmq';
import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { Tenant } from 'src/database/entities/base-app-entities/tenant.entity';
import { OtpService } from 'src/services/otp.service';
import { TenantModule } from './tenant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, Subscription]),
    BullModule.registerQueue({ name: 'tenant-setup' }),
    JwtModule,
    forwardRef(() => TenantModule),
  ],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
