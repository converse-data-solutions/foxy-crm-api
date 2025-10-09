import { Role } from 'src/enums/core-app.enum';

export class CookiePayload {
  tenantAccessToken: string | null;
  accessToken: string | null;
  role: Role;
  xTenantId: string;
}
