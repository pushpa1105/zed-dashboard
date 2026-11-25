import { useMemo } from 'react';

import { useSession } from '@/core/auth/session';

import { modules } from '../modules';
import { buildAppWorkspace } from '../registry';

import { WorkspaceShell } from './workspace-shell';

/**
 * Authenticated layout of the main app (apps, components, settings…). It is
 * a workspace like the dashboards, so every shell layout applies to it too.
 */
export function AppShell() {
  const { data: user } = useSession();
  const workspace = useMemo(() => buildAppWorkspace(modules, user), [user]);
  return <WorkspaceShell workspace={workspace} />;
}
