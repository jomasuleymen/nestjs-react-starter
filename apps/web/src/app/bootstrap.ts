import { setUnauthorizedHandler } from '@api/http';
import { authSession } from '@modules/auth';

import { queryClient } from './queryClient';
import { router } from './router';

const noop = (): void => undefined;

let disposeApp: (() => void) | null = null;

export const bootstrapApp = (): (() => void) => {
  if (disposeApp !== null) {
    return disposeApp;
  }

  authSession.setInvalidatedHandler((reason) => {
    queryClient.clear();

    const currentLocation = router.state.location.href;
    if (router.state.location.pathname === '/login') {
      return;
    }

    void router.navigate({
      to: '/login',
      replace: true,
      search: reason === 'expired' ? { reason: 'session-expired', redirect: currentLocation } : {},
    });
  });
  setUnauthorizedHandler(() => authSession.invalidate('expired'));

  const unsubscribeFromSessionEvents = authSession.subscribeToSessionEvents();
  const dispose = (): void => {
    if (disposeApp !== dispose) {
      return;
    }

    unsubscribeFromSessionEvents();
    authSession.setInvalidatedHandler(noop);
    setUnauthorizedHandler(noop);
    disposeApp = null;
  };

  disposeApp = dispose;
  return dispose;
};
