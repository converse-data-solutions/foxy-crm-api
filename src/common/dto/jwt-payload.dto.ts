import { Expose } from 'class-transformer';
import { Role } from 'src/enum/core-app.enum';

export class JwtPayload {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  role?: Role;
}
