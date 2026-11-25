import {
  ArrowLeftRight,
  Calculator,
  CalendarX2,
  ClipboardList,
  ClipboardX,
  PackagePlus,
  PackageX,
  ShoppingCart,
  Truck,
  Warehouse,
} from 'lucide-react';

import type { FeatureWorkspace } from '@/core/feature/define-feature';

import { inventoryRoutes as r } from './routes';

/**
 * Header extras of the Inventory workspace: the notification feed (sample data:
 * replace `items` with a query against your notifications endpoint), the
 * "Create" menu and the account menu links.
 */
export const shell = {
  notifications: {
    categories: [
      { id: 'stock', label: (t) => t('inventory:shell.categories.stock') },
      { id: 'receiving', label: (t) => t('inventory:shell.categories.receiving') },
      { id: 'counts', label: (t) => t('inventory:shell.categories.counts') },
    ],
    items: [
      {
        id: 'reorder',
        category: 'stock',
        icon: PackageX,
        tone: 'danger',
        title: (t) => t('inventory:shell.notifications.reorder.title'),
        body: (t) => t('inventory:shell.notifications.reorder.body'),
        minutesAgo: 7,
        to: r.reorder.href(),
        unread: true,
      },
      {
        id: 'arrived',
        category: 'receiving',
        icon: Truck,
        tone: 'primary',
        title: (t) => t('inventory:shell.notifications.arrived.title'),
        body: (t) => t('inventory:shell.notifications.arrived.body'),
        minutesAgo: 30,
        to: r.receiving.href(),
        unread: true,
      },
      {
        id: 'variance',
        category: 'counts',
        icon: ClipboardX,
        tone: 'warning',
        title: (t) => t('inventory:shell.notifications.variance.title'),
        body: (t) => t('inventory:shell.notifications.variance.body'),
        minutesAgo: 80,
        to: r.counts.href(),
        unread: true,
      },
      {
        id: 'expiry',
        category: 'stock',
        icon: CalendarX2,
        tone: 'warning',
        title: (t) => t('inventory:shell.notifications.expiry.title'),
        body: (t) => t('inventory:shell.notifications.expiry.body'),
        minutesAgo: 240,
        to: r.batches.href(),
      },
      {
        id: 'transfer',
        category: 'receiving',
        icon: ArrowLeftRight,
        tone: 'success',
        title: (t) => t('inventory:shell.notifications.transfer.title'),
        body: (t) => t('inventory:shell.notifications.transfer.body'),
        minutesAgo: 1500,
        to: r.transfers.href(),
      },
      {
        id: 'valuation',
        category: 'counts',
        icon: Calculator,
        title: (t) => t('inventory:shell.notifications.valuation.title'),
        body: (t) => t('inventory:shell.notifications.valuation.body'),
        minutesAgo: 4320,
        to: r.valuation.href(),
      },
    ],
    viewAllTo: r.movements.href(),
  },
  quickActions: [
    {
      id: 'item',
      to: r.items.href(),
      icon: PackagePlus,
      label: (t) => t('inventory:shell.create.item.label'),
      description: (t) => t('inventory:shell.create.item.description'),
    },
    {
      id: 'po',
      to: r.purchaseOrders.href(),
      icon: ShoppingCart,
      label: (t) => t('inventory:shell.create.po.label'),
      description: (t) => t('inventory:shell.create.po.description'),
    },
    {
      id: 'transfer',
      to: r.transfers.href(),
      icon: ArrowLeftRight,
      label: (t) => t('inventory:shell.create.transfer.label'),
      description: (t) => t('inventory:shell.create.transfer.description'),
    },
    {
      id: 'count',
      to: r.counts.href(),
      icon: ClipboardList,
      label: (t) => t('inventory:shell.create.count.label'),
      description: (t) => t('inventory:shell.create.count.description'),
    },
  ],
  accountLinks: [
    {
      id: 'counts',
      to: r.counts.href(),
      icon: ClipboardList,
      label: (t) => t('inventory:shell.account.counts'),
    },
    {
      id: 'warehouses',
      to: r.warehouses.href(),
      icon: Warehouse,
      label: (t) => t('inventory:shell.account.warehouses'),
    },
  ],
} satisfies Pick<FeatureWorkspace, 'notifications' | 'quickActions' | 'accountLinks'>;
