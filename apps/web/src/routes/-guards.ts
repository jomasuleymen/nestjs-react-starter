import { redirect } from '@tanstack/react-router';

import { canAccess, type AccessRule, type AuthUser } from '@modules/auth';

import type { RouterContext } from './-context';
import { resolveLandingRoute } from './-landing-route';

interface AuthGuardContext {
  context: RouterContext;
  location: { href: string };
}

interface AnonymousOnlyGuardContext {
  context: RouterContext;
}

interface ProtectedRouteGuardContext {
  context: { user: AuthUser };
}

export const sanitizeInternalRedirect = (value: string | undefined): string | undefined => {
  if (value === undefined || !value.startsWith('/') || value.startsWith('//')) {
    return undefined;
  }

  try {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin
      ? `${url.pathname}${url.search}${url.hash}`
      : undefined;
  } catch {
    return undefined;
  }
};

export const createProtectedRouteGuard =
  () =>
  async ({ context, location }: AuthGuardContext): Promise<{ user: AuthUser }> => {
    const snapshot = await context.auth.ensureSession();
    if (snapshot.status !== 'authenticated') {
      throw redirect({
        to: '/login',
        search: { redirect: sanitizeInternalRedirect(location.href) },
      });
    }

    return { user: snapshot.user };
  };

export const createRouteAccessGuard =
  (rule: AccessRule) =>
  ({ context }: ProtectedRouteGuardContext): void => {
    if (!canAccess(context.user, rule)) {
      throw redirect({ to: '/no-access' });
    }
  };

export const createAnonymousOnlyRouteGuard =
  () =>
  async ({ context }: AnonymousOnlyGuardContext): Promise<void> => {
    const snapshot = await context.auth.ensureSession();
    if (snapshot.status === 'authenticated') {
      throw redirect({ to: resolveLandingRoute(snapshot.user) });
    }
  };
