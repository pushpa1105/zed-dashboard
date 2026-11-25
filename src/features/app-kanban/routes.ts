import { defineRoute } from '@/core/config/routes';

export const appKanbanRoutes = {
  index: defineRoute('/app/kanban'),
} as const;
