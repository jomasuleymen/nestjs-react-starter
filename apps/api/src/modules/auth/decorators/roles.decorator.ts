import { UserRole } from '@generated/prisma/enums';
import { CustomDecorator, SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export function Roles(...roles: UserRole[]): CustomDecorator<string> {
  if (roles.length === 0) {
    throw new Error('Roles are required');
  }

  return SetMetadata(ROLES_KEY, [...roles]);
}
