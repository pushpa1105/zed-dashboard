import { z } from 'zod';

/* Gift cards -------------------------------------------------------------- */

export const GIFT_CARD_STATUSES = ['active', 'redeemed', 'expired', 'disabled'] as const;
export const GIFT_CARD_TABS = ['all', ...GIFT_CARD_STATUSES] as const;
export const GIFT_CARD_VALUES = [25, 50, 100, 150, 250] as const;
export const GIFT_CARD_EXPIRY = ['never', '6', '12', '24'] as const;
export type GiftCardTab = (typeof GIFT_CARD_TABS)[number];

export const giftCardSchema = z.object({
  id: z.string(),
  code: z.string(),
  initialValue: z.number(),
  balance: z.number(),
  status: z.enum(GIFT_CARD_STATUSES),
  recipientName: z.string(),
  recipientEmail: z.string(),
  source: z.enum(['purchase', 'staff']),
  issuedAt: z.number(),
  expiresAt: z.number().nullable(),
  lastUsedAt: z.number().nullable(),
});
export type GiftCard = z.infer<typeof giftCardSchema>;

export const giftCardsResponseSchema = z.object({
  data: z.array(giftCardSchema),
  counts: z.record(z.enum(GIFT_CARD_TABS), z.number()),
  summary: z.object({
    outstanding: z.number(),
    issued: z.number(),
    redeemed: z.number(),
    active: z.number(),
  }),
  monthly: z.array(z.object({ month: z.string(), issued: z.number(), redeemed: z.number() })),
});

export const giftCardDetailSchema = giftCardSchema.extend({
  note: z.string(),
  redemptions: z.array(
    z.object({
      id: z.string(),
      orderId: z.string(),
      orderNumber: z.string(),
      amount: z.number(),
      at: z.number(),
    }),
  ),
});

export const giftCardFormSchema = z.object({
  recipientName: z.string().trim().min(1, 'validation.required').max(60, 'validation.tooLong'),
  recipientEmail: z.email('validation.email'),
  value: z
    .number()
    .min(5, 'ecommerce:giftCards.issue.valueRange')
    .max(2000, 'ecommerce:giftCards.issue.valueRange'),
  expiry: z.enum(GIFT_CARD_EXPIRY),
  note: z.string().trim().max(200, 'validation.tooLong'),
});
export type GiftCardForm = z.infer<typeof giftCardFormSchema>;

/* Abandoned carts --------------------------------------------------------- */

export const RECOVERY_STATUSES = ['not_sent', 'sent', 'recovered'] as const;
export const CART_TABS = ['all', ...RECOVERY_STATUSES] as const;
export type CartTab = (typeof CART_TABS)[number];

export const cartsSearchSchema = z.object({
  status: z.enum(CART_TABS).catch('all'),
  page: z.coerce.number().int().min(1).catch(1),
});
export type CartsSearch = z.infer<typeof cartsSearchSchema>;

export const abandonedCartSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  items: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      variant: z.string(),
      qty: z.number(),
      price: z.number(),
      hue: z.number(),
    }),
  ),
  value: z.number(),
  lastSeenAt: z.number(),
  checkoutStep: z.enum(['cart', 'shipping', 'payment']),
  recovery: z.enum(RECOVERY_STATUSES),
  emailSentAt: z.number().nullable(),
  recoveredAt: z.number().nullable(),
});
export type AbandonedCart = z.infer<typeof abandonedCartSchema>;

export const cartsPageSchema = z.object({
  data: z.array(abandonedCartSchema),
  meta: z.object({ page: z.number(), total: z.number(), totalPages: z.number() }),
  counts: z.record(z.enum(CART_TABS), z.number()),
  summary: z.object({
    abandonedValue: z.number(),
    recoveredValue: z.number(),
    recoveryRate: z.number(),
    pendingEmails: z.number(),
  }),
  weekly: z.array(
    z.object({ week: z.string(), abandoned: z.number(), recovered: z.number(), rate: z.number() }),
  ),
});
