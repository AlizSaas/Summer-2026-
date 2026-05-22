import { ThemeProvider } from "@/components/common/theme-provider";
import { AppRouter } from "@/worker/trpc/router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";




import type { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
    

export interface RouterAppContext {
  trpc: TRPCOptionsProxy<AppRouter>;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
    notFoundComponent: () => (
        <div>
          <h1>404 - Not Found</h1>
            <p>The page you are looking for does not exist.</p>
        </div>
    ),  
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
