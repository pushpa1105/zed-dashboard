import { z } from 'zod';

export const dispatchOrderSchema = z.object({
  id: z.string(),
  customer: z.string(),
  city: z.string(),
  windowStart: z.string(),
  windowEnd: z.string(),
  parcels: z.number(),
  weightKg: z.number(),
  priority: z.boolean(),
  driverId: z.string().nullable(),
});
export type DispatchOrder = z.infer<typeof dispatchOrderSchema>;

export const dispatchDriverSchema = z.object({
  id: z.string(),
  name: z.string(),
  base: z.string(),
  vehicle: z.string().nullable(),
  capacityKg: z.number(),
  hoursLeft: z.number(),
});
export type DispatchDriver = z.infer<typeof dispatchDriverSchema>;

/** Today's board: drivers on shift and every order, assigned (`driverId`) or not. */
export const dispatchBoardSchema = z.object({
  drivers: z.array(dispatchDriverSchema),
  orders: z.array(dispatchOrderSchema),
});
export type DispatchBoard = z.infer<typeof dispatchBoardSchema>;

export type AssignOrder = { orderId: string; driverId: string | null };

export const totalWeight = (orders: DispatchOrder[]) =>
  orders.reduce((sum, o) => sum + o.weightKg, 0);
