import { QueryClient } from '@tanstack/react-query';

import { isApiError } from '@api/http';

const shouldRetry = (failureCount: number, error: unknown): boolean => {
  if (failureCount >= 2) {
    return false;
  }

  if (!isApiError(error)) {
    return true;
  }

  if (error.kind === 'aborted' || error.kind === 'authentication') {
    return false;
  }

  return error.kind === 'network' || error.kind === 'unknown' || (error.status ?? 0) >= 500;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: shouldRetry,
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
});
