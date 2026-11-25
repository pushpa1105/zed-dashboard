import { BarChart3, CreditCard, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react';

import { routes } from '@/core/config/routes';
import type { WorkspaceNotifications } from '@/core/feature/define-feature';

/** Notification feed for workspaces that don't declare their own (e.g. the main app). */
export const DEFAULT_NOTIFICATIONS: WorkspaceNotifications = {
  categories: [
    { id: 'activity', label: (t) => t('shell.sample.categories.activity') },
    { id: 'system', label: (t) => t('shell.sample.categories.system') },
  ],
  items: [
    {
      id: 'mention',
      category: 'activity',
      icon: MessageSquare,
      tone: 'primary',
      actor: 'Hannah Morgan',
      title: (t) => t('shell.sample.mention.title'),
      body: (t) => t('shell.sample.mention.body'),
      minutesAgo: 6,
      unread: true,
    },
    {
      id: 'payment',
      category: 'activity',
      icon: CreditCard,
      tone: 'success',
      title: (t) => t('shell.sample.payment.title'),
      body: (t) => t('shell.sample.payment.body'),
      minutesAgo: 42,
      unread: true,
    },
    {
      id: 'report',
      category: 'activity',
      icon: BarChart3,
      title: (t) => t('shell.sample.report.title'),
      body: (t) => t('shell.sample.report.body'),
      minutesAgo: 60 * 20,
    },
    {
      id: 'security',
      category: 'system',
      icon: ShieldCheck,
      tone: 'warning',
      title: (t) => t('shell.sample.security.title'),
      body: (t) => t('shell.sample.security.body'),
      minutesAgo: 60 * 30,
      to: routes.settings.href(),
    },
    {
      id: 'release',
      category: 'system',
      icon: Sparkles,
      title: (t) => t('shell.sample.release.title'),
      body: (t) => t('shell.sample.release.body'),
      minutesAgo: 60 * 24 * 4,
    },
  ],
  settingsTo: routes.settings.href(),
};
