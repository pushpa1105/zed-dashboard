import type { QueryClient } from '@tanstack/react-query';

import type { FeatureRoute, PageModule } from '@/core/feature/define-feature';
import { matchPath, type LoaderFunctionArgs } from '@/core/router/router';

type PageRoute = Pick<FeatureRoute, 'path' | 'page'>;

/**
 * Wraps a page loader so it prefetches in the background: navigation never
 * waits for data, the page renders at once and shows its skeletons.
 */
export function backgroundLoader(page: PageModule, queryClient: QueryClient) {
  const load = page.loader?.({ queryClient });
  return (
    load &&
    ((args: LoaderFunctionArgs) => {
      void load(args);
      return null;
    })
  );
}

/** Loads a page's code and data before the click (menu hover or focus). */
export function preloadRoute(routes: PageRoute[], href: string, queryClient: QueryClient) {
  const url = new URL(href, window.location.origin);
  for (const route of routes) {
    const match = matchPath(route.path, url.pathname);
    if (!match) continue;
    void route.page().then((page) =>
      backgroundLoader(
        page,
        queryClient,
      )?.({
        request: new Request(url),
        params: match.params,
        context: {},
      } as LoaderFunctionArgs),
    );
    return;
  }
}
