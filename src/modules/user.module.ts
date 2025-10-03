import { Module } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { UserController } from '../controllers/user.controller';
import { CountryModule } from './country.module';
import { TenantModule } from './tenant.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';

@Module({
  imports: [CountryModule, TenantModule, TypeOrmModule.forFeature([Subscription])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
