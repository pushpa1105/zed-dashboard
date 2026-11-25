import { defineRoute } from '@/core/config/routes';

/** Routes of the E-commerce workspace. Every path starts with the workspace prefix. */
export const ecommerceRoutes = {
  overview: defineRoute('/ecommerce'),
  orders: defineRoute('/ecommerce/orders'),
  order: defineRoute('/ecommerce/orders/:orderId'),
  products: defineRoute('/ecommerce/products'),
  product: defineRoute('/ecommerce/products/:productId'),
  categories: defineRoute('/ecommerce/categories'),
  customers: defineRoute('/ecommerce/customers'),
  customer: defineRoute('/ecommerce/customers/:customerId'),
  reviews: defineRoute('/ecommerce/reviews'),
  discounts: defineRoute('/ecommerce/discounts'),
  giftCards: defineRoute('/ecommerce/gift-cards'),
  abandonedCarts: defineRoute('/ecommerce/abandoned-carts'),
  salesReports: defineRoute('/ecommerce/reports'),
  transactions: defineRoute('/ecommerce/transactions'),
  returns: defineRoute('/ecommerce/returns'),
  settings: defineRoute('/ecommerce/settings'),
} as const;
