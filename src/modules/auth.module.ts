import { Module } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { AuthController } from '../controllers/auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'src/common/strategy/jwt.startegy';
import { TenantModule } from './tenant.module';
import { OtpModule } from './otp.module';
import { CountryModule } from './country.module';
import { UserModule } from './user.module';
import { entities } from 'src/database/entities/base-app-entities';
import { TokenModule } from './token.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature(entities),
    TenantModule,
    OtpModule,
    CountryModule,
    UserModule,
    TokenModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
