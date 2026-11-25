import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Suspense, useState, type ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { WorkspaceCatalogContext, type WorkspaceSummary } from '@/core/feature/workspace-catalog';
import { reportError } from '@/core/observability/report-error';
import { createQueryClient } from '@/core/query/query-client';
import { ThemedToaster } from '@/core/theme/components/themed-toaster';
import { PageLoader } from '@/shared/components/page-loader';
import { TooltipProvider } from '@/shared/ui/tooltip';

import { modules } from './modules';
import { AppErrorFallback } from './pages/error-pages';
import { flattenNav, getWorkspaces } from './registry';

/** Every dashboard workspace, for galleries inside features (computed once). */
const catalog: WorkspaceSummary[] = getWorkspaces(modules).map((ws) => ({
  id: ws.id,
  basePath: ws.basePath,
  name: ws.name,
  description: ws.description,
  category: ws.category,
  icon: ws.icon,
  layout: ws.layout,
  preview: ws.preview,
  pageCount: ws.nav.flatMap((section) => flattenNav(section.items)).length,
}));

type ProvidersProps = {
  children: ReactNode;
  /** Inject a client in tests; a fresh one is created otherwise. */
  queryClient?: QueryClient;
};

/** Every app-wide provider, in one place. */
export function Providers({ children, queryClient: injected }: ProvidersProps) {
  const [queryClient] = useState(() => injected ?? createQueryClient());

  return (
    <ErrorBoundary
      FallbackComponent={AppErrorFallback}
      onError={(error, info) => reportError(error, { componentStack: info.componentStack })}
    >
      <Suspense fallback={<PageLoader />}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={200}>
            <WorkspaceCatalogContext.Provider value={catalog}>
              {children}
            </WorkspaceCatalogContext.Provider>
            <ThemedToaster />
          </TooltipProvider>
          {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="bottom-left" />}
        </QueryClientProvider>
      </Suspense>
    </ErrorBoundary>
  );
}
