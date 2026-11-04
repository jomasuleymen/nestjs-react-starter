import { useCurrentUser } from '../model/authStore';
import { canAccess, type AccessRule } from '../model/permissions';

import type { ReactNode } from 'react';

interface PermissionGuardProps {
  access: AccessRule;
  children: ReactNode;
  fallback?: ReactNode;
}

export const PermissionGuard = ({ access, children, fallback = null }: PermissionGuardProps) => {
  const user = useCurrentUser();
  return user !== null && canAccess(user, access) ? children : fallback;
};
