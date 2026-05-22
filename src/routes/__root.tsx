import { ThemeProvider } from "@/components/common/theme-provider";
import { AppRouter } from "@/worker/trpc/router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";




import type { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { NotFound } from "@/components/common/not-found";
import { DefaultCatchBoundary } from "@/components/common/default-cache-boundary";
    

export interface RouterAppContext {
  trpc: TRPCOptionsProxy<AppRouter>;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
    notFoundComponent: () => <NotFound />,  
  errorComponent: DefaultCatchBoundary,
    
    
  component: () => (
    <>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <NuqsAdapter>
          <Outlet />
        </NuqsAdapter>
        <TanStackRouterDevtools />
      </ThemeProvider>
    </>
  ),
});
