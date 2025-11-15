import { Module } from '@nestjs/common';
import { CrmGateway } from 'src/gateway/crm.gateway';
import { MetricService } from 'src/services/metric.service';
import { TokenModule } from './token.module';
import { UserModule } from './user.module';
import { LoggerModule } from './logger.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from 'src/database/entities/base-app-entities';

@Module({
  imports: [TokenModule, UserModule, LoggerModule, TypeOrmModule.forFeature(entities)],
  providers: [MetricService, CrmGateway],
  exports: [MetricService],
})
export class MetricModule {}
