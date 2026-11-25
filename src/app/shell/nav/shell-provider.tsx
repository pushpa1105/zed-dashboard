import { useQueryClient } from '@tanstack/react-query';
import { useMemo, type ReactNode } from 'react';

import { preloadRoute } from '@/app/preload';
import { filterNav, findActiveTrail, type Workspace } from '@/app/registry';
import { useSession } from '@/core/auth/session';
import { useLocation } from '@/core/router/router';
import { useThemeStore } from '@/core/theme/store';

import { ShellContext } from './use-shell';

export function ShellProvider({
  workspace,
  children,
}: {
  workspace: Workspace;
  children: ReactNode;
}) {
  const { pathname, search } = useLocation();
  const { data: user } = useSession();
  const override = useThemeStore((s) => s.layout);
  const queryClient = useQueryClient();

  const value = useMemo(() => {
    const sections = filterNav(workspace.nav, user);
    return {
      workspace,
      sections,
      trail: findActiveTrail(sections, pathname, [workspace.basePath], search),
      pathname,
      layout: override === 'auto' ? workspace.layout : override,
      preload: (href: string) => preloadRoute(workspace.routes, href, queryClient),
    };
  }, [workspace, user, pathname, search, override, queryClient]);

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}
