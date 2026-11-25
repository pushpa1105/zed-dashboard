import { z } from 'zod';

import type { Tone } from '@/shared/components/display/tone';

/* Orders ------------------------------------------------------------------ */

export const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const;
export const ORDER_TABS = ['all', ...ORDER_STATUSES] as const;
export const ORDER_CHANNELS = ['online', 'pos', 'marketplace', 'social'] as const;
export const PAYMENT_STATES = ['paid', 'pending', 'refunded', 'partially_refunded'] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type OrderTab = (typeof ORDER_TABS)[number];

export const orderSummarySchema = z.object({
  id: z.string(),
  number: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  channel: z.enum(ORDER_CHANNELS),
  status: z.enum(ORDER_STATUSES),
  payment: z.enum(PAYMENT_STATES),
  itemCount: z.number(),
  total: z.number(),
  createdAt: z.number(),
});
export type OrderSummary = z.infer<typeof orderSummarySchema>;

export const ordersPageSchema = z.object({
  data: z.array(orderSummarySchema),
  meta: z.object({ page: z.number(), total: z.number(), totalPages: z.number() }),
  counts: z.record(z.enum(ORDER_TABS), z.number()),
});
export type OrdersPage = z.infer<typeof ordersPageSchema>;

export const ordersSearchSchema = z.object({
  status: z.enum(ORDER_TABS).catch('all'),
  q: z.string().catch(''),
  channel: z.string().catch(''),
  payment: z.string().catch(''),
  sort: z.string().catch('createdAt:desc'),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(5).max(100).catch(20),
});
export type OrdersSearch = z.infer<typeof ordersSearchSchema>;

const orderEventSchema = z.object({
  id: z.string(),
  type: z.enum(['placed', 'paid', 'packed', 'shipped', 'delivered', 'note', 'refund', 'cancelled']),
  at: z.number(),
  text: z.string(),
  author: z.string().optional(),
});
export type OrderEvent = z.infer<typeof orderEventSchema>;

export const orderDetailSchema = orderSummarySchema.omit({ itemCount: true }).extend({
  items: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      variant: z.string(),
      sku: z.string(),
      qty: z.number(),
      price: z.number(),
      hue: z.number(),
    }),
  ),
  subtotal: z.number(),
  shipping: z.number(),
  tax: z.number(),
  discount: z.number(),
  refunded: z.number(),
  shippingAddress: z.object({
    line1: z.string(),
    city: z.string(),
    zip: z.string(),
    country: z.string(),
  }),
  paymentMethod: z.object({ brand: z.string(), last4: z.string() }),
  carrier: z.string().nullable(),
  tracking: z.string().nullable(),
  events: z.array(orderEventSchema),
  customer: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    orders: z.number(),
    spent: z.number(),
    segment: z.string(),
    joinedAt: z.number(),
  }),
});
export type OrderDetail = z.infer<typeof orderDetailSchema>;

/* Catalog ----------------------------------------------------------------- */

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable(),
  position: z.number(),
  visible: z.boolean(),
  productCount: z.number(),
});
export type Category = z.infer<typeof categorySchema>;

export const PRODUCT_STATUSES = ['active', 'draft', 'archived'] as const;

const productBase = {
  id: z.string(),
  name: z.string(),
  handle: z.string(),
  sku: z.string(),
  categoryId: z.string(),
  vendor: z.string(),
  status: z.enum(PRODUCT_STATUSES),
  price: z.number(),
  compareAt: z.number().nullable(),
  cost: z.number(),
  stock: z.number(),
  tags: z.array(z.string()),
  rating: z.number(),
  reviews: z.number(),
  sold: z.number(),
  hue: z.number(),
  updatedAt: z.number(),
};

export const productSummarySchema = z.object({ ...productBase, variantCount: z.number() });
export type ProductSummary = z.infer<typeof productSummarySchema>;

export const productsResponseSchema = z.object({
  data: z.array(productSummarySchema),
  categories: z.array(categorySchema),
});

export const variantSchema = z.object({
  id: z.string(),
  title: z.string(),
  sku: z.string(),
  price: z.number(),
  stock: z.number(),
});
export type Variant = z.infer<typeof variantSchema>;

export const productDetailSchema = z.object({
  ...productBase,
  description: z.string(),
  seoTitle: z.string(),
  seoDescription: z.string(),
  variants: z.array(variantSchema),
  categories: z.array(categorySchema),
});
export type ProductDetail = z.infer<typeof productDetailSchema>;

/** Form values of the product editor (validated on save). */
export const productFormSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().max(2000),
  status: z.enum(PRODUCT_STATUSES),
  vendor: z.string().trim().min(1),
  categoryId: z.string().min(1),
  tags: z.array(z.string()),
  price: z.number().min(0),
  compareAt: z.number().min(0).nullable(),
  cost: z.number().min(0),
  variants: z.array(variantSchema),
  handle: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/),
  seoTitle: z.string().max(70),
  seoDescription: z.string().max(160),
});
export type ProductForm = z.infer<typeof productFormSchema>;

export const stockLevel = (stock: number) =>
  stock === 0 ? 'out' : stock < 20 ? 'low' : ('in' as const);

/* Customers --------------------------------------------------------------- */

export const SEGMENTS = ['all', 'vip', 'repeat', 'new', 'at_risk'] as const;
export type Segment = (typeof SEGMENTS)[number];

export const SEGMENT_TONE: Record<Exclude<Segment, 'all'>, Tone> = {
  vip: 'violet',
  repeat: 'blue',
  new: 'aqua',
  at_risk: 'orange',
};

export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  city: z.string(),
  country: z.string(),
  segment: z.enum(['vip', 'repeat', 'new', 'at_risk']),
  orders: z.number(),
  spent: z.number(),
  lastOrderAt: z.number(),
  joinedAt: z.number(),
  acceptsMarketing: z.boolean(),
  tags: z.array(z.string()),
  note: z.string(),
});
export type Customer = z.infer<typeof customerSchema>;

export const customersResponseSchema = z.object({
  data: z.array(customerSchema),
  segments: z.record(z.string(), z.number()),
});

export const customerDetailSchema = customerSchema.extend({
  history: z.array(orderSummarySchema),
  addresses: z.array(
    z.object({
      id: z.string(),
      label: z.enum(['home', 'work']),
      line1: z.string(),
      city: z.string(),
      zip: z.string(),
      country: z.string(),
      isDefault: z.boolean(),
    }),
  ),
  notes: z.array(
    z.object({ id: z.string(), text: z.string(), author: z.string(), at: z.number() }),
  ),
});
export type CustomerDetail = z.infer<typeof customerDetailSchema>;

/* Reviews ----------------------------------------------------------------- */

export const REVIEW_TABS = ['pending', 'approved', 'rejected', 'all'] as const;
export type ReviewTab = (typeof REVIEW_TABS)[number];

export const reviewSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string(),
  author: z.string(),
  rating: z.number(),
  title: z.string(),
  body: z.string(),
  createdAt: z.number(),
  status: z.enum(['pending', 'approved', 'rejected']),
  verified: z.boolean(),
});
export type Review = z.infer<typeof reviewSchema>;

export const reviewsResponseSchema = z.object({
  data: z.array(reviewSchema),
  counts: z.record(z.enum(REVIEW_TABS), z.number()),
  average: z.number(),
  distribution: z.array(z.object({ stars: z.number(), count: z.number() })),
});

/* Discounts --------------------------------------------------------------- */

export const DISCOUNT_TYPES = ['percentage', 'fixed', 'free_shipping'] as const;

export const discountSchema = z.object({
  id: z.string(),
  code: z.string(),
  type: z.enum(DISCOUNT_TYPES),
  value: z.number(),
  minSpend: z.number(),
  status: z.enum(['active', 'scheduled', 'expired']),
  used: z.number(),
  limit: z.number().nullable(),
  startsAt: z.number(),
  endsAt: z.number().nullable(),
  appliesTo: z.string(),
});
export type Discount = z.infer<typeof discountSchema>;

export const discountFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(20)
    .regex(/^[A-Za-z0-9]+$/),
  type: z.enum(DISCOUNT_TYPES),
  value: z.number().min(0),
  minSpend: z.number().min(0),
  limit: z.number().int().min(1).nullable(),
  appliesTo: z.string().trim().min(1),
  startsAt: z.number(),
  endsAt: z.number().nullable(),
});
export type DiscountForm = z.infer<typeof discountFormSchema>;
