import { defineRoute } from '@/core/config/routes';

export const appChatRoutes = {
  index: defineRoute('/app/chat'),
} as const;
