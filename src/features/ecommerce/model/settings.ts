import { z } from 'zod';

export const CURRENCIES = ['USD', 'CAD', 'EUR', 'GBP', 'AUD'] as const;
export const TIMEZONES = [
  'America/Toronto',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Madrid',
  'Australia/Melbourne',
] as const;

const required = z.string().trim().min(1, 'validation.required');
const id = z.string();

export const generalSettingsSchema = z.object({
  storeName: required.max(60, 'validation.tooLong'),
  contactEmail: z.email('validation.email'),
  phone: z.string().trim().max(30, 'validation.tooLong'),
  currency: z.enum(CURRENCIES),
  timezone: z.enum(TIMEZONES),
  weightUnit: z.enum(['kg', 'lb']),
  orderPrefix: z.string().trim().max(6, 'validation.tooLong'),
});

export const shippingSettingsSchema = z.object({
  zones: z.array(
    z.object({
      id,
      name: required,
      countries: z.array(z.string()).min(1, 'validation.required'),
      rates: z.array(
        z.object({
          id,
          name: required,
          price: z.number().min(0),
          freeOver: z.number().min(0).nullable(),
        }),
      ),
    }),
  ),
});

export const taxSettingsSchema = z.object({
  pricesIncludeTax: z.boolean(),
  chargeOnShipping: z.boolean(),
  rates: z.array(z.object({ id, region: required, rate: z.number().min(0).max(30) })),
});

export const notificationSettingsSchema = z.object({
  staffEmail: z.email('validation.email'),
  orderConfirmation: z.boolean(),
  shippingUpdates: z.boolean(),
  abandonedCart: z.boolean(),
  lowStock: z.boolean(),
  lowStockThreshold: z.number().int().min(1).max(500),
  dailySummary: z.boolean(),
});

export const storeSettingsSchema = z.object({
  general: generalSettingsSchema,
  shipping: shippingSettingsSchema,
  taxes: taxSettingsSchema,
  notifications: notificationSettingsSchema,
});
export type StoreSettings = z.infer<typeof storeSettingsSchema>;
export type SettingsSection = keyof StoreSettings;
