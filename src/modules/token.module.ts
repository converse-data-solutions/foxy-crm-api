import { forwardRef, Module } from '@nestjs/common';
import { TokenService } from '../services/token.service';
import { JWT_CONFIG } from 'src/shared/utils/config.util';
import { JwtModule } from '@nestjs/jwt';
import { TenantModule } from './tenant.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: JWT_CONFIG.ACCESS_SECRET_KEY,
        signOptions: { expiresIn: JWT_CONFIG.JWT_ACCESS_EXPIRES_IN },
      }),
    }),
    forwardRef(() => TenantModule),
  ],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
