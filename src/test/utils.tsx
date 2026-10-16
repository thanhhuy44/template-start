import type { ReactElement, ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";

export const createTestQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

export interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

export const renderWithProviders = (
  ui: ReactElement,
  options?: CustomRenderOptions,
): RenderResult => {
  const queryClient = options?.queryClient ?? createTestQueryClient();

  const Wrapper = ({ children }: { children: ReactNode }): ReactNode => {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  return render(ui, { wrapper: Wrapper, ...options });
};

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
