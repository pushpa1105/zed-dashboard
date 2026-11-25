import { create } from 'zustand';

/**
 * The title of the page currently on screen, keyed by its pathname. `Head`
 * publishes it; the shell's breadcrumbs use it for pages that have no menu
 * entry of their own (detail pages, sub-tabs).
 */
export const usePageTitle = create<{ pathname: string | null; title: string | null }>(() => ({
  pathname: null,
  title: null,
}));
