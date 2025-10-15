import { forwardRef, Module } from '@nestjs/common';
import { TokenService } from '../services/token.service';
import { JWT_CONFIG } from 'src/shared/utils/config.util';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from 'src/database/entities/base-app-entities';
import { TenantModule } from './tenant.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: JWT_CONFIG.ACCESS_SECRET_KEY,
        signOptions: { expiresIn: JWT_CONFIG.JWT_ACCESS_EXPIRES_IN },
      }),
    }),
    TypeOrmModule.forFeature(entities),
    forwardRef(() => TenantModule),
  ],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
