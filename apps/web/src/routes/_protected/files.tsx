import { createFileRoute } from '@tanstack/react-router';

import { ACCESS_RULES } from '@modules/auth';
import { FilesPage } from '@modules/files';

import { createRouteAccessGuard } from '../-guards';

export const Route = createFileRoute('/_protected/files')({
  beforeLoad: createRouteAccessGuard(ACCESS_RULES.FILES),
  component: FilesPage,
});
