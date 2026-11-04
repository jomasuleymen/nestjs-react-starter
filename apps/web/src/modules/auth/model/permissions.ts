export const ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  FILES_VIEW: 'files:view',
  WORKSPACE_VIEW: 'workspace:view',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface AuthUser {
  id: string;
  login: string;
  permissions: readonly Permission[];
  role: Role;
}

export interface AccessRule {
  permissions?: readonly Permission[];
  roles?: readonly Role[];
}

export const roleLabels = {
  [ROLES.ADMIN]: 'Администратор',
  [ROLES.USER]: 'Пользователь',
} as const satisfies Record<Role, string>;

export const rolePermissions = {
  [ROLES.ADMIN]: [PERMISSIONS.WORKSPACE_VIEW, PERMISSIONS.FILES_VIEW],
  [ROLES.USER]: [PERMISSIONS.WORKSPACE_VIEW, PERMISSIONS.FILES_VIEW],
} as const satisfies Record<Role, readonly Permission[]>;

export const ACCESS_RULES = {
  FILES: { permissions: [PERMISSIONS.FILES_VIEW] },
  WORKSPACE: { permissions: [PERMISSIONS.WORKSPACE_VIEW] },
} as const satisfies Record<string, AccessRule>;

export const canAccess = (user: AuthUser, rule: AccessRule): boolean => {
  const hasRole = rule.roles === undefined || rule.roles.includes(user.role);
  const hasPermissions =
    rule.permissions === undefined ||
    rule.permissions.every((permission) => user.permissions.includes(permission));

  return hasRole && hasPermissions;
};
