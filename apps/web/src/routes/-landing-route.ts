import {
  ACCESS_RULES,
  ROLES,
  canAccess,
  type AccessRule,
  type AuthUser,
  type Role,
} from '@modules/auth';

import type { FileRoutesByTo } from '../routeTree.gen';

const landingAccess = {
  '/workspace': ACCESS_RULES.WORKSPACE,
} as const satisfies Partial<Record<keyof FileRoutesByTo, AccessRule>>;

export type LandingRoute = keyof typeof landingAccess;

const roleLandingRoute = {
  [ROLES.ADMIN]: '/workspace',
  [ROLES.USER]: '/workspace',
} as const satisfies Record<Role, LandingRoute>;

export const resolveLandingRoute = (user: AuthUser): LandingRoute | '/no-access' => {
  const route = roleLandingRoute[user.role];
  return canAccess(user, landingAccess[route]) ? route : '/no-access';
};
