import type { QueryClient } from '@tanstack/react-query';

import { RequireAuth, RequireGuest } from '@/core/auth/guards';
import { HOME_AFTER_LOGIN, routes } from '@/core/config/routes';
import type { FeatureModule, FeatureRoute } from '@/core/feature/define-feature';
import { Outlet, redirect, type RouteObject } from '@/core/router/router';
import { PageLoader } from '@/shared/components/page-loader';

import { modules as registeredModules } from './modules';
import { ForbiddenPage, RouteError } from './pages/error-pages';
import { backgroundLoader } from './preload';
import { flattenNav, getRoutes, getWorkspaces, type Workspace } from './registry';
import { AppShell } from './shell/app-shell';
import { AuthShell } from './shell/auth-shell';
import { NavigationProgress } from './shell/navigation-progress';
import { WorkspaceShell } from './shell/workspace-shell';

/** Turns a feature route into a lazy route object (code-split, optional loader). */
function toRouteObject(route: FeatureRoute, queryClient: QueryClient): RouteObject {
  const page: RouteObject = {
    path: route.path,
    lazy: async () => {
      const page = await route.page();
      return { Component: page.default, loader: backgroundLoader(page, queryClient) };
    },
  };

  if (!route.roles) return page;

  // Role-restricted: wrap the page in a guard layout.
  return {
    element: (
      <RequireAuth roles={route.roles} forbidden={<ForbiddenPage />}>
        <Outlet />
      </RequireAuth>
    ),
    children: [page],
  };
}

/**
 * A workspace subtree: its shell, then its pages. A page declared at the
 * workspace's own base path becomes the index; otherwise the index redirects
 * to the first menu entry.
 */
function toWorkspaceRoute(workspace: Workspace, queryClient: QueryClient): RouteObject {
  const pages = workspace.routes.map((route) => {
    const object = toRouteObject({ ...route, access: 'protected' }, queryClient);
    return route.path === workspace.basePath && !route.roles
      ? ({ index: true, lazy: object.lazy } as RouteObject)
      : object;
  });
  const hasIndex = workspace.routes.some((route) => route.path === workspace.basePath);
  const first = workspace.nav
    .flatMap((section) => flattenNav(section.items))
    .find((node) => !node.disabled && !node.external && node.to !== workspace.basePath)?.to;

  return {
    path: workspace.basePath,
    element: (
      <RequireAuth>
        <WorkspaceShell workspace={workspace} />
      </RequireAuth>
    ),
    children: [
      {
        errorElement: <RouteError />,
        children: [
          ...(hasIndex || !first ? [] : [{ index: true, loader: () => redirect(first) }]),
          ...pages,
        ],
      },
    ],
  };
}

/**
 * The whole route tree, assembled from the module registry:
 *
 *   /…                every `public` feature route (the landing feature owns "/")
 *   (guest layout)    every `guest` route, e.g. /login, /register
 *   /app              app shell + every `protected` route
 *   /<workspace>      each dashboard workspace in its own shell
 *   *                 404
 */
export function createAppRoutes(
  queryClient: QueryClient,
  modules: FeatureModule[] = registeredModules,
): RouteObject[] {
  const routesFor = (access: FeatureRoute['access']) =>
    getRoutes(modules, access).map((route) => toRouteObject(route, queryClient));

  return [
    {
      element: (
        <>
          <NavigationProgress />
          <Outlet />
        </>
      ),
      HydrateFallback: PageLoader,
      errorElement: <RouteError />,
      children: [
        ...routesFor('public'),
        {
          element: (
            <RequireGuest>
              <AuthShell />
            </RequireGuest>
          ),
          children: routesFor('guest'),
        },
        {
          path: routes.app.path,
          element: (
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          ),
          children: [
            {
              errorElement: <RouteError />, // keeps the shell visible when a page fails
              children: [
                { index: true, loader: () => redirect(HOME_AFTER_LOGIN.href()) },
                ...routesFor('protected'),
              ],
            },
          ],
        },
        ...getWorkspaces(modules).map((workspace) => toWorkspaceRoute(workspace, queryClient)),
        {
          path: '*',
          lazy: () => import('./pages/not-found-page').then((m) => ({ Component: m.default })),
        },
      ],
    },
  ];
}
