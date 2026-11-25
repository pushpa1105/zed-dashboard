import {
  CalendarClock,
  ChartNoAxesCombined,
  ExternalLink,
  FileCheck2,
  Handshake,
  LayoutDashboard,
  Package,
  ReceiptText,
  Route,
  ShieldCheck,
  Siren,
  SquareKanban,
  Truck,
  UserRound,
  Warehouse,
} from 'lucide-react';

import { defineFeature } from '@/core/feature/define-feature';

import en from './i18n/en.json';
import { logisticsRoutes as r } from './routes';
import { shell } from './shell';

export default defineFeature({
  id: 'logistics',
  i18n: { en },
  workspace: {
    basePath: '/logistics',
    name: (t) => t('logistics:workspace.name'),
    description: (t) => t('logistics:workspace.description'),
    category: (t) => t('logistics:workspace.category'),
    icon: Truck,
    layout: 'floating',
    ...shell,
    order: 80,
    preview: '/previews/logistics.png',
    nav: [
      {
        id: 'operations',
        label: (t) => t('logistics:nav.sections.operations'),
        icon: LayoutDashboard,
        items: [
          {
            to: r.overview.href(),
            icon: LayoutDashboard,
            label: (t) => t('logistics:nav.overview'),
          },
          {
            to: r.shipments.href(),
            icon: Package,
            label: (t) => t('logistics:nav.shipments'),
            badge: 186,
          },
          {
            to: r.exceptions.href(),
            icon: Siren,
            label: (t) => t('logistics:nav.exceptions'),
            badge: { label: 14, tone: 'danger' },
          },
          {
            to: r.dispatch.href(),
            icon: SquareKanban,
            label: (t) => t('logistics:nav.dispatch'),
            badge: { label: 12, tone: 'warning' },
          },
        ],
      },
      {
        id: 'network',
        label: (t) => t('logistics:nav.sections.network'),
        icon: Truck,
        items: [
          {
            icon: Truck,
            label: (t) => t('logistics:nav.fleetGroup'),
            children: [
              { to: r.fleet.href(), label: (t) => t('logistics:nav.fleet') },
              { to: r.drivers.href(), label: (t) => t('logistics:nav.drivers') },
            ],
          },
          { to: r.routes.href(), icon: Route, label: (t) => t('logistics:nav.routes') },
          { to: r.docks.href(), icon: Warehouse, label: (t) => t('logistics:nav.docks') },
        ],
      },
      {
        id: 'partners',
        label: (t) => t('logistics:nav.sections.partners'),
        icon: Handshake,
        items: [
          { to: r.carriers.href(), icon: Handshake, label: (t) => t('logistics:nav.carriers') },
          {
            icon: ShieldCheck,
            label: (t) => t('logistics:nav.slas'),
            children: [
              { to: r.slas.href(), label: (t) => t('logistics:nav.slaCustomers') },
              {
                to: r.slas.href({ status: 'breached' }),
                label: (t) => t('logistics:nav.slaBreached'),
              },
            ],
          },
        ],
      },
      {
        id: 'finance',
        label: (t) => t('logistics:nav.sections.finance'),
        icon: ReceiptText,
        items: [
          {
            to: r.billing.href(),
            icon: ReceiptText,
            label: (t) => t('logistics:nav.billing'),
            badge: 20,
          },
          {
            to: r.performance.href(),
            icon: ChartNoAxesCombined,
            label: (t) => t('logistics:nav.performance'),
          },
        ],
      },
      {
        id: 'more',
        label: (t) => t('logistics:nav.sections.more'),
        icon: FileCheck2,
        items: [
          {
            to: '/logistics/customs',
            icon: FileCheck2,
            label: (t) => t('logistics:nav.customs'),
            disabled: true,
            badge: { label: 'Soon', tone: 'default' },
          },
          {
            to: '/logistics/slots',
            icon: CalendarClock,
            label: (t) => t('logistics:nav.carrierSlots'),
            disabled: true,
          },
          {
            to: 'https://example.com/carrier-portal',
            icon: ExternalLink,
            label: (t) => t('logistics:nav.carrierPortal'),
            external: true,
          },
          {
            to: r.drivers.href(),
            icon: UserRound,
            label: (t) => t('logistics:nav.myShift'),
            roles: ['USER'],
          },
        ],
      },
    ],
    routes: [
      { path: r.overview.path, page: () => import('./pages/overview-page') },
      { path: r.shipments.path, page: () => import('./pages/shipments-page') },
      { path: r.shipment.path, page: () => import('./pages/shipment-page') },
      { path: r.exceptions.path, page: () => import('./pages/exceptions-page') },
      { path: r.dispatch.path, page: () => import('./pages/dispatch-page') },
      { path: r.fleet.path, page: () => import('./pages/fleet-page') },
      { path: r.vehicle.path, page: () => import('./pages/vehicle-page') },
      { path: r.drivers.path, page: () => import('./pages/drivers-page') },
      { path: r.driver.path, page: () => import('./pages/driver-page') },
      { path: r.routes.path, page: () => import('./pages/routes-page') },
      { path: r.docks.path, page: () => import('./pages/docks-page') },
      { path: r.billing.path, page: () => import('./pages/billing-page') },
      { path: r.carriers.path, page: () => import('./pages/carriers-page') },
      { path: r.slas.path, page: () => import('./pages/slas-page') },
      { path: r.performance.path, page: () => import('./pages/performance-page') },
    ],
  },
});
