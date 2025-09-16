import { Module } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { AuthController } from '../controller/auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from 'src/database/entity/base-app/tenant.entity';
import { TenantSubscription } from 'src/database/entity/base-app/tenant-subscription.entity';
import { BullModule } from '@nestjs/bullmq';
import { TenantWorker } from 'src/worker/tenant-worker';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, TenantSubscription]),
    BullModule.registerQueue({
      name: 'tenant-setup',
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TenantWorker],
})
export class AuthModule {}
