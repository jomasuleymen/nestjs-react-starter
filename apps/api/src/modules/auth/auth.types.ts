import { RequestUser } from '@common/request-context';
import { Request } from 'express';

export type AuthenticatedUser = RequestUser;

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface JwtAccessPayload {
  sub: string;
  login: string;
  type: 'access';
}

export interface JwtRefreshPayload {
  sub: string;
  sid: string;
  type: 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSessionRecord {
  id: string;
}

export interface CreateSessionInput {
  userId: string;
  metadata: SessionMetadata;
}

export interface RefreshSessionInput {
  sessionId: string;
  userId: string;
  metadata: SessionMetadata;
}

export interface AuthSessionResult {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

export interface SessionMetadata {
  userAgent?: string;
  ipAddress?: string;
}
