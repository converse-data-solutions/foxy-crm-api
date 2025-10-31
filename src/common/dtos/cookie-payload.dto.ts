import { Role } from 'src/enums/core-app.enum';

export class CookiePayload {
  accessToken: string | null;
  refreshToken: string | null;
  role?: Role;
  xTenantId?: string;
}
