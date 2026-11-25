import {
  Banknote,
  Gift,
  PackagePlus,
  PackageX,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  TicketPercent,
  Undo2,
  Wallet,
} from 'lucide-react';

import type { FeatureWorkspace } from '@/core/feature/define-feature';

import { ecommerceRoutes as r } from './routes';

/**
 * Header extras of the E-commerce workspace: the notification feed (sample data:
 * replace `items` with a query against your notifications endpoint), the
 * "Create" menu and the account menu links.
 */
export const shell = {
  notifications: {
    categories: [
      { id: 'orders', label: (t) => t('ecommerce:shell.categories.orders') },
      { id: 'stock', label: (t) => t('ecommerce:shell.categories.stock') },
      { id: 'customers', label: (t) => t('ecommerce:shell.categories.customers') },
    ],
    items: [
      {
        id: 'order',
        category: 'orders',
        icon: ShoppingBag,
        tone: 'success',
        title: (t) => t('ecommerce:shell.notifications.order.title'),
        body: (t) => t('ecommerce:shell.notifications.order.body'),
        minutesAgo: 3,
        to: r.orders.href(),
        unread: true,
      },
      {
        id: 'lowStock',
        category: 'stock',
        icon: PackageX,
        tone: 'danger',
        title: (t) => t('ecommerce:shell.notifications.lowStock.title'),
        body: (t) => t('ecommerce:shell.notifications.lowStock.body'),
        minutesAgo: 25,
        to: r.products.href(),
        unread: true,
      },
      {
        id: 'review',
        category: 'customers',
        icon: Star,
        tone: 'warning',
        actor: 'Jackson Lee',
        title: (t) => t('ecommerce:shell.notifications.review.title'),
        body: (t) => t('ecommerce:shell.notifications.review.body'),
        minutesAgo: 50,
        to: r.reviews.href(),
        unread: true,
      },
      {
        id: 'return',
        category: 'orders',
        icon: Undo2,
        tone: 'primary',
        title: (t) => t('ecommerce:shell.notifications.return.title'),
        body: (t) => t('ecommerce:shell.notifications.return.body'),
        minutesAgo: 120,
        to: r.returns.href(),
      },
      {
        id: 'carts',
        category: 'customers',
        icon: ShoppingCart,
        title: (t) => t('ecommerce:shell.notifications.carts.title'),
        body: (t) => t('ecommerce:shell.notifications.carts.body'),
        minutesAgo: 300,
        to: r.abandonedCarts.href(),
      },
      {
        id: 'payout',
        category: 'orders',
        icon: Banknote,
        tone: 'success',
        title: (t) => t('ecommerce:shell.notifications.payout.title'),
        body: (t) => t('ecommerce:shell.notifications.payout.body'),
        minutesAgo: 1620,
        to: r.transactions.href(),
      },
    ],
    viewAllTo: r.orders.href(),
    settingsTo: r.settings.href(),
  },
  quickActions: [
    {
      id: 'product',
      to: r.products.href(),
      icon: PackagePlus,
      label: (t) => t('ecommerce:shell.create.product.label'),
      description: (t) => t('ecommerce:shell.create.product.description'),
    },
    {
      id: 'order',
      to: r.orders.href(),
      icon: ReceiptText,
      label: (t) => t('ecommerce:shell.create.order.label'),
      description: (t) => t('ecommerce:shell.create.order.description'),
    },
    {
      id: 'discount',
      to: r.discounts.href(),
      icon: TicketPercent,
      label: (t) => t('ecommerce:shell.create.discount.label'),
      description: (t) => t('ecommerce:shell.create.discount.description'),
    },
    {
      id: 'giftCard',
      to: r.giftCards.href(),
      icon: Gift,
      label: (t) => t('ecommerce:shell.create.giftCard.label'),
      description: (t) => t('ecommerce:shell.create.giftCard.description'),
    },
  ],
  accountLinks: [
    {
      id: 'store',
      to: r.settings.href(),
      icon: Store,
      label: (t) => t('ecommerce:shell.account.store'),
    },
    {
      id: 'payouts',
      to: r.transactions.href(),
      icon: Wallet,
      label: (t) => t('ecommerce:shell.account.payouts'),
    },
  ],
} satisfies Pick<FeatureWorkspace, 'notifications' | 'quickActions' | 'accountLinks'>;
