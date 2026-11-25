import { createContext, useContext } from 'react';

import type { FeatureWorkspace } from './define-feature';

/** Public facts about one dashboard workspace, for galleries and pickers. */
export type WorkspaceSummary = Pick<
  FeatureWorkspace,
  'basePath' | 'name' | 'description' | 'category' | 'icon' | 'layout' | 'preview'
> & {
  id: string;
  /** Number of linkable pages in its menu. */
  pageCount: number;
};

/**
 * Lets any feature list the registered workspaces without importing the app
 * layer (features never import `app/`). The app provides the value in
 * `app/providers.tsx`; features read it with `useWorkspaceCatalog()`.
 */
export const WorkspaceCatalogContext = createContext<WorkspaceSummary[]>([]);

export const useWorkspaceCatalog = () => useContext(WorkspaceCatalogContext);
