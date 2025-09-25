import { Module } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { AuthController } from '../controller/auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from 'src/database/entity/base-app/tenant.entity';
import { TenantSubscription } from 'src/database/entity/base-app/tenant-subscription.entity';
import { BullModule } from '@nestjs/bullmq';
import { TenantProcessor } from 'src/processor/tenant-processor';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'src/common/strategy/jwt.startegy';
import { Country } from 'src/database/entity/common-entity/country.entity';
import { Subscription } from 'src/database/entity/base-app/subscription.entity';
import { TenantModule } from './tenant.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Tenant, TenantSubscription, Country, Subscription]),
    BullModule.registerQueue({ name: 'tenant-setup' }),
    JwtModule,
    TenantModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, TenantProcessor, JwtStrategy],
})
export class AuthModule {}
