import {
  Banknote,
  ChartColumn,
  Gift,
  LayoutDashboard,
  MessageSquareQuote,
  Package,
  Percent,
  ReceiptText,
  Settings,
  ShoppingBag,
  Store,
  Tags,
  UsersRound,
} from 'lucide-react';

import { defineFeature } from '@/core/feature/define-feature';

import en from './i18n/en.json';
import { ecommerceRoutes as r } from './routes';
import { shell } from './shell';

export default defineFeature({
  id: 'ecommerce',
  i18n: { en },
  workspace: {
    basePath: '/ecommerce',
    name: (t) => t('ecommerce:workspace.name'),
    description: (t) => t('ecommerce:workspace.description'),
    category: (t) => t('ecommerce:workspace.category'),
    icon: ShoppingBag,
    layout: 'sidebar',
    ...shell,
    order: 10,
    preview: '/previews/ecommerce.png',
    nav: [
      {
        id: 'store',
        label: (t) => t('ecommerce:nav.sections.store'),
        icon: Store,
        items: [
          {
            to: r.overview.href(),
            icon: LayoutDashboard,
            label: (t) => t('ecommerce:nav.overview'),
          },
          {
            icon: ReceiptText,
            label: (t) => t('ecommerce:nav.orders'),
            badge: { label: 12, tone: 'primary' },
            children: [
              { to: r.orders.href(), label: (t) => t('ecommerce:nav.allOrders') },
              {
                to: r.orders.href({ status: 'pending' }),
                label: (t) => t('ecommerce:nav.pending'),
                badge: 12,
              },
              { to: r.returns.href(), label: (t) => t('ecommerce:nav.returns') },
              { to: r.abandonedCarts.href(), label: (t) => t('ecommerce:nav.abandonedCarts') },
            ],
          },
          {
            to: r.transactions.href(),
            icon: Banknote,
            label: (t) => t('ecommerce:nav.transactions'),
          },
          {
            to: r.salesReports.href(),
            icon: ChartColumn,
            label: (t) => t('ecommerce:nav.salesReports'),
          },
        ],
      },
      {
        id: 'catalog',
        label: (t) => t('ecommerce:nav.sections.catalog'),
        icon: Package,
        items: [
          {
            icon: Package,
            label: (t) => t('ecommerce:nav.catalog'),
            children: [
              { to: r.products.href(), label: (t) => t('ecommerce:nav.products') },
              { to: r.categories.href(), label: (t) => t('ecommerce:nav.categories') },
              {
                to: r.products.href({ view: 'list', stock: 'low' }),
                label: (t) => t('ecommerce:nav.inventory'),
              },
            ],
          },
        ],
      },
      {
        id: 'customers',
        label: (t) => t('ecommerce:nav.sections.customers'),
        icon: UsersRound,
        items: [
          { to: r.customers.href(), icon: UsersRound, label: (t) => t('ecommerce:nav.customers') },
          {
            to: r.reviews.href(),
            icon: MessageSquareQuote,
            label: (t) => t('ecommerce:nav.reviews'),
            badge: { label: 'New', tone: 'success' },
          },
        ],
      },
      {
        id: 'marketing',
        label: (t) => t('ecommerce:nav.sections.marketing'),
        icon: Percent,
        items: [
          { to: r.discounts.href(), icon: Tags, label: (t) => t('ecommerce:nav.discounts') },
          { to: r.giftCards.href(), icon: Gift, label: (t) => t('ecommerce:nav.giftCards') },
          {
            to: 'https://example.com',
            external: true,
            icon: Store,
            label: (t) => t('ecommerce:nav.storefront'),
          },
        ],
      },
      {
        id: 'configuration',
        label: (t) => t('ecommerce:nav.sections.configuration'),
        icon: Settings,
        items: [
          { to: r.settings.href(), icon: Settings, label: (t) => t('ecommerce:nav.settings') },
        ],
      },
    ],
    routes: [
      { path: r.overview.path, page: () => import('./pages/overview-page') },
      { path: r.orders.path, page: () => import('./pages/orders-page') },
      { path: r.order.path, page: () => import('./pages/order-detail-page') },
      { path: r.products.path, page: () => import('./pages/products-page') },
      { path: r.product.path, page: () => import('./pages/product-editor-page') },
      { path: r.categories.path, page: () => import('./pages/categories-page') },
      { path: r.customers.path, page: () => import('./pages/customers-page') },
      { path: r.customer.path, page: () => import('./pages/customer-detail-page') },
      { path: r.reviews.path, page: () => import('./pages/reviews-page') },
      { path: r.discounts.path, page: () => import('./pages/discounts-page') },
      { path: r.giftCards.path, page: () => import('./pages/gift-cards-page') },
      { path: r.abandonedCarts.path, page: () => import('./pages/abandoned-carts-page') },
      { path: r.salesReports.path, page: () => import('./pages/sales-reports-page') },
      { path: r.transactions.path, page: () => import('./pages/transactions-page') },
      { path: r.returns.path, page: () => import('./pages/returns-page') },
      { path: r.settings.path, page: () => import('./pages/settings-page') },
    ],
  },
});
