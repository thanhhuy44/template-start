import { QueryClient } from "@tanstack/react-query";

export const getContext = (): { queryClient: QueryClient } => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000 } },
  });

  return {
    queryClient,
  };
};
