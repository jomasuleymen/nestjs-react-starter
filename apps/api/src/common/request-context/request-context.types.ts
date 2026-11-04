import { UserRole } from '@generated/prisma/enums';
import { ClsStore } from 'nestjs-cls';

export interface RequestUser {
  id: string;
  login: string;
  role: UserRole;
}

export interface RequestContext extends ClsStore {
  user?: RequestUser;
  clientIp?: string;
}
