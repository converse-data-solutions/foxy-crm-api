import { Module } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { AuthController } from '../controllers/auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from 'src/database/entities/base-app-entities/tenant.entity';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'src/common/strategy/jwt.startegy';
import { Plan } from 'src/database/entities/base-app-entities/plan.entity';
import { TenantModule } from './tenant.module';
import { OtpModule } from './otp.module';
import { CountryModule } from './country.module';
import { UserModule } from './user.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Tenant, Subscription, Plan]),
    JwtModule,
    TenantModule,
    OtpModule,
    CountryModule,
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
