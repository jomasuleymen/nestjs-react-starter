import { createRouter } from '@tanstack/react-router';

import { authSession } from '@modules/auth';
import type { RouterContext } from '@routes/-context';

import { routeTree } from '../routeTree.gen';

import { queryClient } from './queryClient';

export const router = createRouter({
  context: { auth: authSession, queryClient } satisfies RouterContext,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  routeTree,
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
