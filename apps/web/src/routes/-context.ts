import type { QueryClient } from '@tanstack/react-query';

import type { AuthSession } from '@modules/auth';

export interface RouterContext {
  auth: AuthSession;
  queryClient: QueryClient;
}
