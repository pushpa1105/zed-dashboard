import {
  CreditCard,
  Flag,
  Gauge,
  KeyRound,
  Rocket,
  ServerCrash,
  UserPlus,
  Webhook,
} from 'lucide-react';

import type { FeatureWorkspace } from '@/core/feature/define-feature';

import { saasRoutes as r } from './routes';

/**
 * Header extras of the SaaS workspace: the notification feed (sample data:
 * replace `items` with a query against your notifications endpoint), the
 * "Create" menu and the account menu links.
 */
export const shell = {
  notifications: {
    categories: [
      { id: 'billing', label: (t) => t('saas:shell.categories.billing') },
      { id: 'system', label: (t) => t('saas:shell.categories.system') },
      { id: 'team', label: (t) => t('saas:shell.categories.team') },
    ],
    items: [
      {
        id: 'incident',
        category: 'system',
        icon: ServerCrash,
        tone: 'danger',
        title: (t) => t('saas:shell.notifications.incident.title'),
        body: (t) => t('saas:shell.notifications.incident.body'),
        minutesAgo: 2,
        to: r.status.href(),
        unread: true,
      },
      {
        id: 'upgrade',
        category: 'billing',
        icon: Rocket,
        tone: 'success',
        title: (t) => t('saas:shell.notifications.upgrade.title'),
        body: (t) => t('saas:shell.notifications.upgrade.body'),
        minutesAgo: 20,
        to: r.customers.href(),
        unread: true,
      },
      {
        id: 'failed',
        category: 'billing',
        icon: CreditCard,
        tone: 'warning',
        title: (t) => t('saas:shell.notifications.failed.title'),
        body: (t) => t('saas:shell.notifications.failed.body'),
        minutesAgo: 90,
        to: r.billing.href(),
        unread: true,
      },
      {
        id: 'invite',
        category: 'team',
        icon: UserPlus,
        tone: 'primary',
        actor: 'Zoe Patel',
        title: (t) => t('saas:shell.notifications.invite.title'),
        body: (t) => t('saas:shell.notifications.invite.body'),
        minutesAgo: 240,
        to: r.team.href(),
      },
      {
        id: 'webhook',
        category: 'system',
        icon: Webhook,
        tone: 'warning',
        title: (t) => t('saas:shell.notifications.webhook.title'),
        body: (t) => t('saas:shell.notifications.webhook.body'),
        minutesAgo: 1500,
        to: r.webhooks.href(),
      },
      {
        id: 'key',
        category: 'team',
        icon: KeyRound,
        title: (t) => t('saas:shell.notifications.key.title'),
        body: (t) => t('saas:shell.notifications.key.body'),
        minutesAgo: 4320,
        to: r.keys.href(),
      },
    ],
    viewAllTo: r.audit.href(),
    settingsTo: r.settings.href(),
  },
  quickActions: [
    {
      id: 'key',
      to: r.keys.href(),
      icon: KeyRound,
      label: (t) => t('saas:shell.create.key.label'),
      description: (t) => t('saas:shell.create.key.description'),
    },
    {
      id: 'member',
      to: r.team.href(),
      icon: UserPlus,
      label: (t) => t('saas:shell.create.member.label'),
      description: (t) => t('saas:shell.create.member.description'),
    },
    {
      id: 'webhook',
      to: r.webhooks.href(),
      icon: Webhook,
      label: (t) => t('saas:shell.create.webhook.label'),
      description: (t) => t('saas:shell.create.webhook.description'),
    },
    {
      id: 'flag',
      to: r.flags.href(),
      icon: Flag,
      label: (t) => t('saas:shell.create.flag.label'),
      description: (t) => t('saas:shell.create.flag.description'),
    },
  ],
  accountLinks: [
    {
      id: 'billing',
      to: r.billing.href(),
      icon: CreditCard,
      label: (t) => t('saas:shell.account.billing'),
    },
    { id: 'keys', to: r.keys.href(), icon: KeyRound, label: (t) => t('saas:shell.account.keys') },
    { id: 'usage', to: r.usage.href(), icon: Gauge, label: (t) => t('saas:shell.account.usage') },
  ],
} satisfies Pick<FeatureWorkspace, 'notifications' | 'quickActions' | 'accountLinks'>;
