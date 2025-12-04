import { Module } from '@nestjs/common';
import { SubscriptionHistoryService } from '../services/subscription-history.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from 'src/database/entities/base-app-entities';

@Module({
  imports: [TypeOrmModule.forFeature(entities)],
  providers: [SubscriptionHistoryService],
  exports: [SubscriptionHistoryService],
})
export class SubscriptionHistoryModule {}
