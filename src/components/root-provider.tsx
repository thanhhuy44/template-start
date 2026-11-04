import { QueryClient } from "@tanstack/react-query";
import type { BetterAuthClientOptions } from "better-auth";
import type { ReactAuthClient } from "better-auth/react";

import { authClient } from "@/lib/auth/client";

export const getContext = (): {
  queryClient: QueryClient;
  authClient: ReactAuthClient<BetterAuthClientOptions>;
} => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000 } },
  });

  return {
    queryClient,
    authClient: authClient,
  };
};
