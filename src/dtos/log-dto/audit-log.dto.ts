import { Action } from 'src/enums/action.enum';

export class AuditLogDto {
  action: Action;
  tenantId: string;
  userId?: string;
  ipAddress?: string;
}
