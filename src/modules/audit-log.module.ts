import { Module } from '@nestjs/common';
import { AuditLogService } from '../services/audit-log.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from 'src/database/entities/base-app-entities';

@Module({
  imports: [TypeOrmModule.forFeature(entities)],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
