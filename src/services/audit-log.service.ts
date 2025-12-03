import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog } from 'src/database/entities/base-app-entities/audit-log.entity';
import { AuditLogDto } from 'src/dtos/log-dto/audit-log.dto';
import { Repository } from 'typeorm';

@Injectable()
export class AuditLogService {
  constructor(@InjectRepository(AuditLog) private readonly auditLogRepo: Repository<AuditLog>) {}

  async createLog(logData: AuditLogDto) {
    const newLog = this.auditLogRepo.create(logData);
    await this.auditLogRepo.save(newLog);
  }
}
