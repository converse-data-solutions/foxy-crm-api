import { Module } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { AuthController } from '../controller/auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from 'src/database/entity/tenant-entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
