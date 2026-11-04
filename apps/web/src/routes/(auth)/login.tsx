import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { LoginPage } from '@modules/auth';

import { createAnonymousOnlyRouteGuard, sanitizeInternalRedirect } from '../-guards';
import { resolveLandingRoute } from '../-landing-route';

const loginSearchSchema = z.object({
  reason: z.enum(['session-expired']).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute('/(auth)/login')({
  beforeLoad: createAnonymousOnlyRouteGuard(),
  component: LoginRoute,
  validateSearch: loginSearchSchema,
});

function LoginRoute() {
  const navigate = Route.useNavigate();
  const { reason, redirect: requestedRedirect } = Route.useSearch();
  const { auth } = Route.useRouteContext();

  const handleSuccess = (): void => {
    const redirectTo = sanitizeInternalRedirect(requestedRedirect);
    const snapshot = auth.getState();
    const fallback = snapshot.status === 'authenticated' ? resolveLandingRoute(snapshot.user) : '/';
    if (redirectTo !== undefined) {
      void navigate({ href: redirectTo, replace: true });
      return;
    }
    void navigate({ to: fallback, replace: true });
  };

  return (
    <LoginPage
      notice={reason === 'session-expired' ? 'Сессия завершена. Войдите повторно.' : undefined}
      onSuccess={handleSuccess}
    />
  );
}
