import { createFileRoute } from '@tanstack/react-router';

import { ApplicationLayout } from '@app/layouts';

import { createProtectedRouteGuard } from '../-guards';

export const Route = createFileRoute('/_protected')({
  beforeLoad: createProtectedRouteGuard(),
  component: ApplicationLayout,
});
