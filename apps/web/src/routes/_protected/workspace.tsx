import { createFileRoute } from '@tanstack/react-router';

import { ACCESS_RULES } from '@modules/auth';
import { WorkspacePage } from '@modules/workspace';

import { createRouteAccessGuard } from '../-guards';

export const Route = createFileRoute('/_protected/workspace')({
  beforeLoad: createRouteAccessGuard(ACCESS_RULES.WORKSPACE),
  component: WorkspacePage,
});
