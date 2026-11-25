import { createContext, useContext } from 'react';

import type { Workspace } from '@/app/registry';
import type { NavNode, NavSection } from '@/core/feature/define-feature';
import type { ShellLayout } from '@/core/theme/config';

export type ShellContextValue = {
  workspace: Workspace;
  /** Menu sections the current user may see. */
  sections: NavSection[];
  /** Root → leaf chain of entries for the current page. */
  trail: NavNode[];
  pathname: string;
  /** The layout actually rendered (theme override or the workspace default). */
  layout: ShellLayout;
  /** Loads a page's code and data ahead of navigation. */
  preload: (href: string) => void;
};

export const ShellContext = createContext<ShellContextValue | null>(null);

/** The current workspace, its visible menu and the active trail. */
export function useShell() {
  const value = useContext(ShellContext);
  if (!value) throw new Error('useShell must be used inside <ShellProvider>');
  return value;
}
