import { Module } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { AuthController } from '../controller/auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from 'src/database/entity/base-app/tenant.entity';
import { TenantSubscription } from 'src/database/entity/base-app/tenant-subscription.entity';
import { BullModule } from '@nestjs/bullmq';
import { TenantWorker } from 'src/worker/tenant-worker';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'src/common/strategy/jwt.startegy';
import { SeedService } from 'src/service/seed.service';
import { Country } from 'src/database/entity/common-entity/country.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Tenant, TenantSubscription, Country]),
    BullModule.registerQueue({ name: 'tenant-setup' }),
    JwtModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, TenantWorker, JwtStrategy, SeedService],
})
export class AuthModule {}
