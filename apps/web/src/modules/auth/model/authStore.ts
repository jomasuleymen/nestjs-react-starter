import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

import { authGetMe, authLogin, authLogout } from '@api/generated/sdk.gen';
import type { AuthUserDto } from '@api/generated/types.gen';
import { isApiError, normalizeApiError, restoreAccessToken, tokenStorage } from '@api/http';

import { ROLES, rolePermissions, type AuthUser, type Role } from './permissions';

export interface LoginCredentials {
  login: string;
  password: string;
}

export type AuthState =
  | { status: 'bootstrapping'; user: null }
  | { status: 'anonymous'; user: null }
  | { status: 'authenticated'; user: AuthUser };

export type SessionInvalidationReason = 'expired' | 'external' | 'logout';

const backendRoles = {
  ADMIN: ROLES.ADMIN,
  USER: ROLES.USER,
} as const satisfies Record<AuthUserDto['role'], Role>;

const toAuthUser = (dto: AuthUserDto): AuthUser => {
  const role = backendRoles[dto.role];
  return {
    id: dto.id,
    login: dto.login,
    permissions: rolePermissions[role],
    role,
  };
};

const store = createStore<AuthState>()(() => ({ status: 'bootstrapping', user: null }));

let sessionBootstrap: Promise<AuthState> | null = null;
let bootstrapGeneration = 0;
let invalidatedHandler: (reason: SessionInvalidationReason) => void = () => undefined;
const sessionEventKey = 'starter:session-ended';

const setState = (state: AuthState): AuthState => {
  store.setState(state, true);
  return state;
};

const cancelSessionBootstrap = (): void => {
  bootstrapGeneration += 1;
  sessionBootstrap = null;
};

const clearSession = (reason: SessionInvalidationReason, broadcast: boolean): void => {
  const previousState = store.getState();
  if (previousState.status === 'anonymous') {
    return;
  }

  cancelSessionBootstrap();
  tokenStorage.clear();
  setState({ status: 'anonymous', user: null });

  if (broadcast && reason !== 'external') {
    try {
      localStorage.setItem(sessionEventKey, `${reason}:${Date.now()}`);
    } catch {
      // Cross-tab logout is best-effort when Web Storage is unavailable.
    }
  }

  if (previousState.status === 'authenticated') {
    invalidatedHandler(reason);
  }
};

const loadSession = async (generation: number): Promise<AuthState> => {
  const isCurrent = (): boolean => generation === bootstrapGeneration;

  try {
    if (!tokenStorage.get()) {
      await restoreAccessToken();
    }

    if (!isCurrent()) {
      return store.getState();
    }

    const response = await authGetMe({ throwOnError: true });
    if (!isCurrent()) {
      return store.getState();
    }

    const user = toAuthUser(response.data);
    return setState({ status: 'authenticated', user });
  } catch (error: unknown) {
    if (!isCurrent()) {
      return store.getState();
    }

    const apiError = isApiError(error) ? error : normalizeApiError(error);
    if (apiError.status === 401) {
      tokenStorage.clear();
      return setState({ status: 'anonymous', user: null });
    }

    throw apiError;
  } finally {
    if (isCurrent()) {
      sessionBootstrap = null;
    }
  }
};

const ensureSession = async (): Promise<AuthState> => {
  const current = store.getState();
  if (current.status !== 'bootstrapping') {
    return current;
  }

  sessionBootstrap ??= loadSession(bootstrapGeneration);
  return sessionBootstrap;
};

const login = async (credentials: LoginCredentials): Promise<AuthUser> => {
  try {
    const response = await authLogin({ body: credentials, throwOnError: true });
    cancelSessionBootstrap();
    tokenStorage.set(response.data.accessToken);
    const user = toAuthUser(response.data.user);
    setState({ status: 'authenticated', user });
    return user;
  } catch (error: unknown) {
    throw normalizeApiError(error);
  }
};

const logout = async (): Promise<void> => {
  const accessToken = tokenStorage.get();
  clearSession('logout', true);

  try {
    await authLogout({
      headers: accessToken === null ? undefined : { Authorization: `Bearer ${accessToken}` },
      throwOnError: true,
    });
  } catch {
    // Local logout has already completed.
  }
};

const subscribeToSessionEvents = (): (() => void) => {
  const handleStorage = (event: StorageEvent): void => {
    if (event.key === sessionEventKey) {
      clearSession('external', false);
    }
  };

  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
};

export const authSession = {
  ensureSession,
  getState: store.getState,
  invalidate: (reason: 'expired' | 'external'): void => clearSession(reason, reason !== 'external'),
  login,
  logout,
  setInvalidatedHandler: (handler: typeof invalidatedHandler): void => {
    invalidatedHandler = handler;
  },
  subscribeToSessionEvents,
};

export type AuthSession = typeof authSession;

export const useAuth = (): AuthState => useStore(store);
export const useCurrentUser = (): AuthUser | null => useStore(store, (state) => state.user);
export const useIsAuthenticated = (): boolean =>
  useStore(store, (state) => state.status === 'authenticated');
