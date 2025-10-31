import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/enums/core-app.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
