// TODO: Configure TanStack Query client
// - defaultOptions.queries: staleTime 30s, retry 1, refetchOnWindowFocus false
// - defaultOptions.mutations: onError → show global error Toast

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
