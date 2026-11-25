import { defineRoute } from '@/core/config/routes';

/** Routes of the Logistics workspace. Every path starts with the workspace prefix. */
export const logisticsRoutes = {
  overview: defineRoute('/logistics'),
  shipments: defineRoute('/logistics/shipments'),
  shipment: defineRoute('/logistics/shipments/:shipmentId'),
  exceptions: defineRoute('/logistics/exceptions'),
  dispatch: defineRoute('/logistics/dispatch'),
  fleet: defineRoute('/logistics/fleet'),
  vehicle: defineRoute('/logistics/fleet/:vehicleId'),
  drivers: defineRoute('/logistics/drivers'),
  driver: defineRoute('/logistics/drivers/:driverId'),
  routes: defineRoute('/logistics/routes'),
  docks: defineRoute('/logistics/docks'),
  billing: defineRoute('/logistics/billing'),
  carriers: defineRoute('/logistics/carriers'),
  slas: defineRoute('/logistics/slas'),
  performance: defineRoute('/logistics/performance'),
} as const;
