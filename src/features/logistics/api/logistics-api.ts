import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';
import type { MutationOptions } from '@/core/query/query-client';

import { billingSchema, invoiceSchema, type Billing, type InvoiceAction } from '../model/billing';
import {
  dispatchBoardSchema,
  dispatchOrderSchema,
  type AssignOrder,
  type DispatchBoard,
} from '../model/dispatch';
import {
  dockDaySchema,
  dockSlotSchema,
  driverDetailSchema,
  driverSchema,
  exceptionSchema,
  overviewSchema,
  plannedRouteSchema,
  shipmentDetailSchema,
  shipmentSchema,
  vehicleDetailSchema,
  vehicleSchema,
  type NewDockSlot,
  type PlannedRoute,
} from '../model/logistics';

const ok = z.object({ ok: z.boolean() });

/** Plain request functions (no React): reusable in loaders and tests. */
export const logisticsApi = {
  overview: () => api.get('/logistics/overview', overviewSchema),
  shipments: () => api.get('/logistics/shipments', z.array(shipmentSchema)),
  shipment: (id: string) => api.get(`/logistics/shipments/${id}`, shipmentDetailSchema),
  reportException: ({ id, note }: { id: string; note: string }) =>
    api.post(`/logistics/shipments/${id}/exception`, { note }, ok),
  exceptions: () => api.get('/logistics/exceptions', z.array(exceptionSchema)),
  updateException: ({
    id,
    action,
    owner,
  }: {
    id: string;
    action: 'resolve' | 'assign' | 'escalate';
    owner?: string;
  }) => api.patch(`/logistics/exceptions/${id}`, { action, owner }, ok),
  fleet: () => api.get('/logistics/fleet', z.array(vehicleSchema)),
  vehicle: (id: string) => api.get(`/logistics/fleet/${id}`, vehicleDetailSchema),
  drivers: () => api.get('/logistics/drivers', z.array(driverSchema)),
  driver: (id: string) => api.get(`/logistics/drivers/${id}`, driverDetailSchema),
  dispatch: () => api.get('/logistics/dispatch', dispatchBoardSchema),
  assignOrder: ({ orderId, driverId }: AssignOrder) =>
    api.patch(`/logistics/dispatch/orders/${orderId}`, { driverId }, dispatchOrderSchema),
  billing: () => api.get('/logistics/billing', billingSchema),
  updateInvoice: ({ id, ...body }: InvoiceAction) =>
    api.patch(`/logistics/billing/invoices/${id}`, body, invoiceSchema),
  routes: () => api.get('/logistics/routes', z.array(plannedRouteSchema)),
  reorderStops: ({ id, stopIds }: { id: string; stopIds: string[] }) =>
    api.put(`/logistics/routes/${id}/stops`, { stopIds }, plannedRouteSchema),
  docks: () => api.get('/logistics/docks', dockDaySchema),
  bookSlot: (slot: NewDockSlot) => api.post('/logistics/docks/slots', slot, dockSlotSchema),
};

export const logisticsKeys = {
  all: ['logistics'] as const,
  overview: () => [...logisticsKeys.all, 'overview'] as const,
  shipments: () => [...logisticsKeys.all, 'shipments'] as const,
  shipment: (id: string) => [...logisticsKeys.shipments(), id] as const,
  exceptions: () => [...logisticsKeys.all, 'exceptions'] as const,
  fleet: () => [...logisticsKeys.all, 'fleet'] as const,
  vehicle: (id: string) => [...logisticsKeys.fleet(), id] as const,
  drivers: () => [...logisticsKeys.all, 'drivers'] as const,
  driver: (id: string) => [...logisticsKeys.drivers(), id] as const,
  dispatch: () => [...logisticsKeys.all, 'dispatch'] as const,
  billing: () => [...logisticsKeys.all, 'billing'] as const,
  routes: () => [...logisticsKeys.all, 'routes'] as const,
  docks: () => [...logisticsKeys.all, 'docks'] as const,
};

export const overviewQuery = () =>
  queryOptions({ queryKey: logisticsKeys.overview(), queryFn: logisticsApi.overview });
export const shipmentsQuery = () =>
  queryOptions({ queryKey: logisticsKeys.shipments(), queryFn: logisticsApi.shipments });
export const shipmentQuery = (id: string) =>
  queryOptions({ queryKey: logisticsKeys.shipment(id), queryFn: () => logisticsApi.shipment(id) });
export const exceptionsQuery = () =>
  queryOptions({ queryKey: logisticsKeys.exceptions(), queryFn: logisticsApi.exceptions });
export const fleetQuery = () =>
  queryOptions({ queryKey: logisticsKeys.fleet(), queryFn: logisticsApi.fleet });
export const vehicleQuery = (id: string) =>
  queryOptions({ queryKey: logisticsKeys.vehicle(id), queryFn: () => logisticsApi.vehicle(id) });
export const driverQuery = (id: string) =>
  queryOptions({ queryKey: logisticsKeys.driver(id), queryFn: () => logisticsApi.driver(id) });
export const dispatchQuery = () =>
  queryOptions({ queryKey: logisticsKeys.dispatch(), queryFn: logisticsApi.dispatch });
export const billingQuery = () =>
  queryOptions({ queryKey: logisticsKeys.billing(), queryFn: logisticsApi.billing });
export const driversQuery = () =>
  queryOptions({ queryKey: logisticsKeys.drivers(), queryFn: logisticsApi.drivers });
export const routesQuery = () =>
  queryOptions({ queryKey: logisticsKeys.routes(), queryFn: logisticsApi.routes });
export const docksQuery = () =>
  queryOptions({ queryKey: logisticsKeys.docks(), queryFn: logisticsApi.docks });

export const useOverview = () => useQuery(overviewQuery());
export const useShipments = () => useQuery(shipmentsQuery());
export const useShipment = (id: string) => useQuery(shipmentQuery(id));
export const useExceptions = () => useQuery(exceptionsQuery());
export const useFleet = () => useQuery(fleetQuery());
export const useDrivers = () => useQuery(driversQuery());
export const useVehicle = (id: string) => useQuery(vehicleQuery(id));
export const useDriver = (id: string) => useQuery(driverQuery(id));
export const useDispatch = () => useQuery(dispatchQuery());
export const useBilling = () => useQuery(billingQuery());
export const useRoutes = () => useQuery(routesQuery());
export const useDocks = () => useQuery(docksQuery());

export function useReportException(
  options?: MutationOptions<unknown, { id: string; note: string }>,
) {
  const { t } = useTranslation('logistics');
  return useMutation({
    mutationFn: logisticsApi.reportException,
    ...options,
    meta: {
      invalidates: [logisticsKeys.all],
      successMessage: t('shipment.reported'),
      ...options?.meta,
    },
  });
}

export function useUpdateException(
  options?: MutationOptions<
    unknown,
    { id: string; action: 'resolve' | 'assign' | 'escalate'; owner?: string }
  >,
) {
  return useMutation({
    mutationFn: logisticsApi.updateException,
    ...options,
    meta: { invalidates: [logisticsKeys.all], ...options?.meta },
  });
}

export function useReorderStops(
  options?: MutationOptions<PlannedRoute, { id: string; stopIds: string[] }>,
) {
  const { t } = useTranslation('logistics');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logisticsApi.reorderStops,
    ...options,
    meta: { successMessage: t('routes.saved'), ...options?.meta },
    onSuccess: (route, ...rest) => {
      queryClient.setQueryData(logisticsKeys.routes(), (prev: PlannedRoute[] | undefined) =>
        prev?.map((r) => (r.id === route.id ? route : r)),
      );
      return options?.onSuccess?.(route, ...rest);
    },
  });
}

export function useBookSlot(options?: MutationOptions<unknown, NewDockSlot>) {
  const { t } = useTranslation('logistics');
  return useMutation({
    mutationFn: logisticsApi.bookSlot,
    ...options,
    meta: {
      invalidates: [logisticsKeys.docks()],
      successMessage: t('docks.booked'),
      ...options?.meta,
    },
  });
}

/**
 * Moves an order on the dispatch board. Applied optimistically so a dropped
 * card stays where it landed; rolled back if the API refuses.
 */
export function useAssignOrder() {
  const queryClient = useQueryClient();
  const key = logisticsKeys.dispatch();
  return useMutation({
    mutationFn: logisticsApi.assignOrder,
    meta: { invalidates: [key] },
    onMutate: async ({ orderId, driverId }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<DispatchBoard>(key);
      queryClient.setQueryData<DispatchBoard>(
        key,
        (board) =>
          board && {
            ...board,
            orders: board.orders.map((o) => (o.id === orderId ? { ...o, driverId } : o)),
          },
      );
      return { previous };
    },
    onError: (_error, _vars, context) => queryClient.setQueryData(key, context?.previous),
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logisticsApi.updateInvoice,
    onSuccess: (invoice) => {
      queryClient.setQueryData<Billing>(
        logisticsKeys.billing(),
        (billing) =>
          billing && {
            ...billing,
            invoices: billing.invoices.map((i) => (i.id === invoice.id ? invoice : i)),
          },
      );
    },
  });
}
