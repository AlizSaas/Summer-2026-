import { createRouter as createTanStackRouter, redirect } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, httpLink, splitLink } from "@trpc/client";
import { TRPCClientError } from "@trpc/client";
import { routeTree } from "./routeTree.gen";

import Pending from "@/components/common/pending";

import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { AppRouter } from "./worker/trpc/router";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (_, error) => {
        if (error instanceof TRPCClientError && error.data?.code === 'UNAUTHORIZED') {
          redirect({ to: '/login' });
          return false;
        }
        return true;
      },
    },
    mutations: {
      onError: (error) => {
        if (error instanceof TRPCClientError && error.data?.code === 'UNAUTHORIZED') {
          redirect({ to: '/login' });
        }
      },
    },
  },
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: createTRPCClient({
    links: [
      splitLink({
        condition: (op) => op.type === 'mutation',
        true: httpLink({
          url: '/trpc',
          fetch: (url, options) => fetch(url, { ...options, credentials: 'include' }),
        }),
        false: httpBatchLink({
          url: '/trpc',
          fetch: (url, options) => fetch(url, { ...options, credentials: 'include' }),
        }),
      }),
    ],
  }),
  queryClient,
});

export function createRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultNotFoundComponent(props) {
      return (
        <div>
          <h1>404 - Not Found</h1>
          <p>No match for <code>{props.isNotFound}</code></p>
        </div>
      );
    },
    defaultPreload: "intent",
    context: {
      trpc,
      queryClient,
    },
    defaultPendingComponent: () => <Pending />,
    Wrap: function WrapComponent({ children }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    },
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}