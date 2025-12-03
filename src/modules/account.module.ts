import { Module } from '@nestjs/common';
import { AccountService } from '../services/account.service';
import { AccountController } from '../controllers/account.controller';
import { CountryModule } from './country.module';
import { SubscriptionModule } from './subscription.module';
import { TenantThrottlerGuard } from 'src/guards/tenant-throttler.guard';

@Module({
  imports: [CountryModule, SubscriptionModule],
  controllers: [AccountController],
  providers: [AccountService, TenantThrottlerGuard],
})
export class AccountModule {}
