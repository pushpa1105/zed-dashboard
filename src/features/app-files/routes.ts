import { defineRoute } from '@/core/config/routes';

export const appFilesRoutes = {
  index: defineRoute('/app/files'),
} as const;
