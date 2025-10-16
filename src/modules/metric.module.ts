import { Module } from '@nestjs/common';
import { CrmGateway } from 'src/gateway/crm.gateway';
import { MetricService } from 'src/services/metric.service';
import { TokenModule } from './token.module';
import { UserModule } from './user.module';
import { LoggerModule } from './logger.module';

@Module({
  imports: [TokenModule, UserModule, LoggerModule],
  providers: [MetricService, CrmGateway],
  exports: [MetricService],
})
export class MetricModule {}
