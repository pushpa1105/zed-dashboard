import { defineRoute } from '@/core/config/routes';

/** Showcase pages added after the central route table (feature-local routes). */
export const uiElementsRoutes = {
  trees: defineRoute('/app/ui/trees'),
  timelines: defineRoute('/app/ui/timelines'),
  menus: defineRoute('/app/ui/menus'),
  widgets: defineRoute('/app/ui/widgets'),
  layouts: defineRoute('/app/ui/layouts'),
} as const;
