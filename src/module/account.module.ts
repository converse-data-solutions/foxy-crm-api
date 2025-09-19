import { Module } from '@nestjs/common';
import { AccountService } from '../service/account.service';
import { AccountController } from '../controller/account.controller';

@Module({
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
