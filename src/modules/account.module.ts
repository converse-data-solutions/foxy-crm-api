import { Module } from '@nestjs/common';
import { AccountService } from '../services/account.service';
import { AccountController } from '../controllers/account.controller';
import { CountryModule } from './country.module';

@Module({
  imports: [CountryModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
