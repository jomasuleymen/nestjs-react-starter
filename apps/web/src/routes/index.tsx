import { createFileRoute, redirect } from '@tanstack/react-router';

import { createProtectedRouteGuard } from './-guards';
import { resolveLandingRoute } from './-landing-route';

const requireProtectedAccess = createProtectedRouteGuard();

export const Route = createFileRoute('/')({
  beforeLoad: async (context) => {
    const { user } = await requireProtectedAccess(context);
    throw redirect({ to: resolveLandingRoute(user) });
  },
});
