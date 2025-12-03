import { Module } from '@nestjs/common';
import { SubscriptionHistoryService } from '../services/subscription-history.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from 'src/database/entities/base-app-entities';
import { AuditLogModule } from './audit-log.module';

@Module({
  imports: [TypeOrmModule.forFeature(entities), AuditLogModule],
  providers: [SubscriptionHistoryService],
  exports: [SubscriptionHistoryService],
})
export class SubscriptionHistoryModule {}
