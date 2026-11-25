import {
  Clock4,
  Gauge,
  PackageCheck,
  PackagePlus,
  PackageX,
  Route,
  Send,
  Warehouse,
  Wrench,
} from 'lucide-react';

import type { FeatureWorkspace } from '@/core/feature/define-feature';

import { logisticsRoutes as r } from './routes';

/**
 * Header extras of the Logistics workspace: the notification feed (sample data:
 * replace `items` with a query against your notifications endpoint), the
 * "Create" menu and the account menu links.
 */
export const shell = {
  notifications: {
    categories: [
      { id: 'exceptions', label: (t) => t('logistics:shell.categories.exceptions') },
      { id: 'shipments', label: (t) => t('logistics:shell.categories.shipments') },
      { id: 'fleet', label: (t) => t('logistics:shell.categories.fleet') },
    ],
    items: [
      {
        id: 'delay',
        category: 'exceptions',
        icon: Clock4,
        tone: 'danger',
        title: (t) => t('logistics:shell.notifications.delay.title'),
        body: (t) => t('logistics:shell.notifications.delay.body'),
        minutesAgo: 5,
        to: r.exceptions.href(),
        unread: true,
      },
      {
        id: 'damaged',
        category: 'exceptions',
        icon: PackageX,
        tone: 'warning',
        actor: 'Carlos Diaz',
        title: (t) => t('logistics:shell.notifications.damaged.title'),
        body: (t) => t('logistics:shell.notifications.damaged.body'),
        minutesAgo: 35,
        to: r.exceptions.href(),
        unread: true,
      },
      {
        id: 'delivered',
        category: 'shipments',
        icon: PackageCheck,
        tone: 'success',
        title: (t) => t('logistics:shell.notifications.delivered.title'),
        body: (t) => t('logistics:shell.notifications.delivered.body'),
        minutesAgo: 75,
        to: r.shipments.href(),
        unread: true,
      },
      {
        id: 'maintenance',
        category: 'fleet',
        icon: Wrench,
        tone: 'warning',
        title: (t) => t('logistics:shell.notifications.maintenance.title'),
        body: (t) => t('logistics:shell.notifications.maintenance.body'),
        minutesAgo: 360,
        to: r.fleet.href(),
      },
      {
        id: 'dock',
        category: 'shipments',
        icon: Warehouse,
        tone: 'primary',
        title: (t) => t('logistics:shell.notifications.dock.title'),
        body: (t) => t('logistics:shell.notifications.dock.body'),
        minutesAgo: 1560,
        to: r.docks.href(),
      },
      {
        id: 'sla',
        category: 'fleet',
        icon: Gauge,
        title: (t) => t('logistics:shell.notifications.sla.title'),
        body: (t) => t('logistics:shell.notifications.sla.body'),
        minutesAgo: 2880,
        to: r.slas.href(),
      },
    ],
    viewAllTo: r.exceptions.href(),
  },
  quickActions: [
    {
      id: 'shipment',
      to: r.shipments.href(),
      icon: PackagePlus,
      label: (t) => t('logistics:shell.create.shipment.label'),
      description: (t) => t('logistics:shell.create.shipment.description'),
    },
    {
      id: 'dispatch',
      to: r.dispatch.href(),
      icon: Send,
      label: (t) => t('logistics:shell.create.dispatch.label'),
      description: (t) => t('logistics:shell.create.dispatch.description'),
    },
    {
      id: 'route',
      to: r.routes.href(),
      icon: Route,
      label: (t) => t('logistics:shell.create.route.label'),
      description: (t) => t('logistics:shell.create.route.description'),
    },
  ],
  accountLinks: [
    {
      id: 'dispatch',
      to: r.dispatch.href(),
      icon: Send,
      label: (t) => t('logistics:shell.account.dispatch'),
    },
    {
      id: 'routes',
      to: r.routes.href(),
      icon: Route,
      label: (t) => t('logistics:shell.account.routes'),
    },
  ],
} satisfies Pick<FeatureWorkspace, 'notifications' | 'quickActions' | 'accountLinks'>;
