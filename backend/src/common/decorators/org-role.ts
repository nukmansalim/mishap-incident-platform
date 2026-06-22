import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'orgRoles';

export const OrgRoles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
