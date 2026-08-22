import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '../http/errors';

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  return !(error instanceof ApiError) || error.status === 0 || error.status >= 500;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
