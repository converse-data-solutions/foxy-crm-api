import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { REDIS_CONFIG } from 'src/shared/utils/config.util';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: REDIS_CONFIG.host,
        port: REDIS_CONFIG.port,
      },
      defaultJobOptions: { removeOnComplete: true },
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
