import { Suspense, type ReactNode } from 'react';

import { Outlet } from '@/core/router/router';
import { PageLoader } from '@/shared/components/page-loader';

import type { Workspace } from '../registry';

import { BoxedLayout } from './layouts/boxed-layout';
import { DualLayout } from './layouts/dual-layout';
import { RailLayout } from './layouts/rail-layout';
import { SidebarLayout } from './layouts/sidebar-layout';
import { TopnavLayout } from './layouts/topnav-layout';
import { ShellProvider } from './nav/shell-provider';
import { useShell } from './nav/use-shell';

function LayoutSwitch({ children }: { children: ReactNode }) {
  const { layout } = useShell();
  switch (layout) {
    case 'rail':
      return <RailLayout>{children}</RailLayout>;
    case 'dual':
      return <DualLayout>{children}</DualLayout>;
    case 'topnav':
    case 'topnav-tabs':
      return <TopnavLayout>{children}</TopnavLayout>;
    case 'boxed':
      return <BoxedLayout>{children}</BoxedLayout>;
    default:
      return <SidebarLayout>{children}</SidebarLayout>;
  }
}

/**
 * Renders a workspace's pages inside its shell. The layout is the
 * workspace's own, unless the theme panel forces one for every workspace.
 */
export function WorkspaceShell({ workspace }: { workspace: Workspace }) {
  return (
    <ShellProvider workspace={workspace}>
      <LayoutSwitch>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </LayoutSwitch>
    </ShellProvider>
  );
}
