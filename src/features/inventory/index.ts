import {
  ArrowRightLeft,
  Boxes,
  CalendarClock,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  Factory,
  Grid3x3,
  History,
  LayoutDashboard,
  PackageOpen,
  PackagePlus,
  Printer,
  Repeat2,
  ScanBarcode,
  Warehouse,
} from 'lucide-react';

import { defineFeature } from '@/core/feature/define-feature';

import en from './i18n/en.json';
import { inventoryRoutes as r } from './routes';
import { shell } from './shell';

const warehouse = (code: string) => r.warehouses.href({ wh: code });

export default defineFeature({
  id: 'inventory',
  i18n: { en },
  workspace: {
    basePath: '/inventory',
    name: (t) => t('inventory:workspace.name'),
    description: (t) => t('inventory:workspace.description'),
    category: (t) => t('inventory:workspace.category'),
    icon: Boxes,
    layout: 'sidebar-dark',
    ...shell,
    order: 50,
    preview: '/previews/inventory.png',
    nav: [
      {
        id: 'stock',
        label: (t) => t('inventory:nav.sections.stock'),
        icon: Boxes,
        items: [
          {
            to: r.overview.href(),
            icon: LayoutDashboard,
            label: (t) => t('inventory:nav.overview'),
          },
          {
            to: r.items.href(),
            icon: PackageOpen,
            label: (t) => t('inventory:nav.items'),
            badge: { label: 35, tone: 'danger' },
          },
          { to: r.counts.href(), icon: ClipboardCheck, label: (t) => t('inventory:nav.counts') },
          {
            icon: CalendarClock,
            label: (t) => t('inventory:nav.batches'),
            children: [
              { to: r.batches.href(), label: (t) => t('inventory:nav.allBatches') },
              {
                to: r.batches.href({ window: '30' }),
                label: (t) => t('inventory:nav.expiringSoon'),
              },
              {
                to: r.batches.href({ window: 'expired' }),
                label: (t) => t('inventory:nav.expired'),
              },
            ],
          },
          {
            to: r.valuation.href(),
            icon: CircleDollarSign,
            label: (t) => t('inventory:nav.valuation'),
          },
        ],
      },
      {
        id: 'movements',
        label: (t) => t('inventory:nav.sections.movements'),
        icon: ArrowRightLeft,
        items: [
          {
            to: r.transfers.href(),
            icon: ArrowRightLeft,
            label: (t) => t('inventory:nav.transfers'),
          },
          {
            to: r.receiving.href(),
            icon: ScanBarcode,
            label: (t) => t('inventory:nav.receiving'),
            badge: { label: 6, tone: 'primary' },
          },
          {
            to: r.movements.href(),
            icon: History,
            label: (t) => t('inventory:nav.movementLedger'),
          },
          {
            to: '/inventory/returns',
            icon: Repeat2,
            label: (t) => t('inventory:nav.returns'),
            disabled: true,
          },
        ],
      },
      {
        id: 'purchasing',
        label: (t) => t('inventory:nav.sections.purchasing'),
        icon: ClipboardList,
        items: [
          {
            to: r.purchaseOrders.href(),
            icon: ClipboardList,
            label: (t) => t('inventory:nav.purchaseOrders'),
          },
          {
            to: r.reorder.href(),
            icon: PackagePlus,
            label: (t) => t('inventory:nav.reorder'),
          },
          { to: r.suppliers.href(), icon: Factory, label: (t) => t('inventory:nav.suppliers') },
        ],
      },
      {
        id: 'network',
        label: (t) => t('inventory:nav.sections.network'),
        icon: Warehouse,
        items: [
          {
            icon: Warehouse,
            label: (t) => t('inventory:nav.warehouses'),
            children: [
              { to: r.warehouses.href(), label: (t) => t('inventory:nav.allWarehouses') },
              { to: warehouse('RNO'), label: (t) => t('inventory:nav.wh.RNO') },
              { to: warehouse('DFW'), label: (t) => t('inventory:nav.wh.DFW') },
              { to: warehouse('EWR'), label: (t) => t('inventory:nav.wh.EWR') },
              { to: warehouse('RTM'), label: (t) => t('inventory:nav.wh.RTM') },
            ],
          },
          { to: r.bins.href(), icon: Grid3x3, label: (t) => t('inventory:nav.bins') },
          {
            to: 'https://www.gs1.org/standards/barcodes',
            icon: Printer,
            label: (t) => t('inventory:nav.labels'),
            external: true,
          },
        ],
      },
    ],
    routes: [
      { path: r.overview.path, page: () => import('./pages/overview-page') },
      { path: r.items.path, page: () => import('./pages/items-page') },
      { path: r.item.path, page: () => import('./pages/item-page') },
      { path: r.counts.path, page: () => import('./pages/counts-page') },
      { path: r.batches.path, page: () => import('./pages/batches-page') },
      { path: r.valuation.path, page: () => import('./pages/valuation-page') },
      { path: r.transfers.path, page: () => import('./pages/transfers-page') },
      { path: r.receiving.path, page: () => import('./pages/receiving-page') },
      { path: r.warehouses.path, page: () => import('./pages/warehouses-page') },
      { path: r.bins.path, page: () => import('./pages/bins-page') },
      { path: r.movements.path, page: () => import('./pages/movements-page') },
      { path: r.purchaseOrders.path, page: () => import('./pages/purchase-orders-page') },
      { path: r.reorder.path, page: () => import('./pages/reorder-page') },
      { path: r.suppliers.path, page: () => import('./pages/suppliers-page') },
      { path: r.supplier.path, page: () => import('./pages/supplier-page') },
    ],
  },
});
