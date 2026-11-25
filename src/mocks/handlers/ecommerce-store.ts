import { HttpResponse } from 'msw';

import { env } from '@/core/config/env';

import { networkDelay, requireAuth } from '../utils';

export function seeded(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* -------------------------------------------------------------------------- */
/*  Store back office: products, categories, customers, orders, reviews,       */
/*  discounts. In memory, so mutations update what the UI reads next.          */
/* -------------------------------------------------------------------------- */

export const DAY = 86_400_000;
export const NOW = Date.UTC(2026, 10, 24, 15, 0);
export const pick = <T>(rand: () => number, list: readonly T[]) =>
  list[Math.floor(rand() * list.length)]!;
export const money = (n: number) => Math.round(n * 100) / 100;

type Category = {
  id: string;
  name: string;
  parentId: string | null;
  position: number;
  visible: boolean;
};
type Variant = { id: string; title: string; sku: string; price: number; stock: number };
export type Product = {
  id: string;
  name: string;
  handle: string;
  sku: string;
  categoryId: string;
  vendor: string;
  status: 'active' | 'draft' | 'archived';
  price: number;
  compareAt: number | null;
  cost: number;
  stock: number;
  tags: string[];
  description: string;
  seoTitle: string;
  seoDescription: string;
  rating: number;
  reviews: number;
  sold: number;
  hue: number;
  variants: Variant[];
  updatedAt: number;
};
export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  segment: 'vip' | 'repeat' | 'new' | 'at_risk';
  orders: number;
  spent: number;
  lastOrderAt: number;
  joinedAt: number;
  acceptsMarketing: boolean;
  tags: string[];
  note: string;
};
export type OrderStatus =
  'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
type OrderEvent = {
  id: string;
  type: 'placed' | 'paid' | 'packed' | 'shipped' | 'delivered' | 'note' | 'refund' | 'cancelled';
  at: number;
  text: string;
  author?: string;
};
export type Order = {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  channel: 'online' | 'pos' | 'marketplace' | 'social';
  status: OrderStatus;
  payment: 'paid' | 'pending' | 'refunded' | 'partially_refunded';
  items: Array<{
    productId: string;
    name: string;
    variant: string;
    sku: string;
    qty: number;
    price: number;
    hue: number;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  refunded: number;
  createdAt: number;
  shippingAddress: { line1: string; city: string; zip: string; country: string };
  paymentMethod: { brand: string; last4: string };
  carrier: string | null;
  tracking: string | null;
  events: OrderEvent[];
};
export type Review = {
  id: string;
  productId: string;
  productName: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  createdAt: number;
  status: 'pending' | 'approved' | 'rejected';
  verified: boolean;
};
export type Discount = {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  minSpend: number;
  status: 'active' | 'scheduled' | 'expired';
  used: number;
  limit: number | null;
  startsAt: number;
  endsAt: number | null;
  appliesTo: string;
};

const CATEGORY_SEED: Array<[string, string, string | null]> = [
  ['cat-apparel', 'Apparel', null],
  ['cat-tops', 'Tops & shirts', 'cat-apparel'],
  ['cat-knit', 'Knitwear', 'cat-apparel'],
  ['cat-outer', 'Outerwear', 'cat-apparel'],
  ['cat-foot', 'Footwear', null],
  ['cat-run', 'Running', 'cat-foot'],
  ['cat-casual', 'Everyday', 'cat-foot'],
  ['cat-bags', 'Bags', null],
  ['cat-travel', 'Travel', 'cat-bags'],
  ['cat-daily', 'Daily carry', 'cat-bags'],
  ['cat-acc', 'Accessories', null],
  ['cat-home', 'Home', null],
];

const PRODUCT_SEED: Array<[string, string, number, string]> = [
  ['Aero Running Shoe', 'cat-run', 129, 'Northpeak'],
  ['Tempo Trail Runner', 'cat-run', 149, 'Northpeak'],
  ['Pacer Lite Racer', 'cat-run', 159, 'Northpeak'],
  ['Weekend Canvas Sneaker', 'cat-casual', 79, 'Fieldwork'],
  ['Suede Desert Boot', 'cat-casual', 189, 'Fieldwork'],
  ['Leather Court Classic', 'cat-casual', 139, 'Fieldwork'],
  ['Linen Overshirt', 'cat-tops', 84, 'Common Thread'],
  ['Oxford Button-down', 'cat-tops', 68, 'Common Thread'],
  ['Heavyweight Pocket Tee', 'cat-tops', 38, 'Common Thread'],
  ['Merino Crew Sweater', 'cat-knit', 118, 'Common Thread'],
  ['Cable-knit Cardigan', 'cat-knit', 142, 'Common Thread'],
  ['Fisherman Beanie', 'cat-acc', 34, 'Harbor & Co.'],
  ['Trail Shell Jacket', 'cat-outer', 219, 'Northpeak'],
  ['Quilted Liner Vest', 'cat-outer', 128, 'Northpeak'],
  ['Waxed Field Coat', 'cat-outer', 289, 'Harbor & Co.'],
  ['Canvas Weekender', 'cat-travel', 168, 'Harbor & Co.'],
  ['Roll-top Travel Pack', 'cat-travel', 196, 'Harbor & Co.'],
  ['Everyday Tote', 'cat-daily', 58, 'Harbor & Co.'],
  ['Sling Crossbody', 'cat-daily', 64, 'Harbor & Co.'],
  ['Laptop Sleeve 14"', 'cat-daily', 49, 'Harbor & Co.'],
  ['Merino Crew Sock (3-pack)', 'cat-acc', 32, 'Common Thread'],
  ['Leather Card Holder', 'cat-acc', 42, 'Harbor & Co.'],
  ['Woven Belt', 'cat-acc', 46, 'Harbor & Co.'],
  ['Stoneware Mug Set', 'cat-home', 54, 'Kiln Studio'],
  ['Linen Throw Blanket', 'cat-home', 112, 'Kiln Studio'],
  ['Ceramic Pour-over Set', 'cat-home', 74, 'Kiln Studio'],
  ['Walnut Serving Board', 'cat-home', 88, 'Kiln Studio'],
  ['Wool Blend Scarf', 'cat-acc', 58, 'Common Thread'],
];

const FIRST = [
  'Sophia',
  'Liam',
  'Amara',
  'Noah',
  'Priya',
  'Mateo',
  'Hana',
  'Oliver',
  'Zoe',
  'Ethan',
  'Ines',
  'Kenji',
  'Leah',
  'Omar',
  'Freya',
  'Lucas',
  'Maya',
  'Diego',
  'Nora',
  'Samuel',
  'Ava',
  'Ravi',
  'Chloe',
  'Felix',
];
const LAST = [
  'Turner',
  'Okafor',
  'Novak',
  'Rossi',
  'Tanaka',
  'Silva',
  'Larsen',
  'Haddad',
  'Morgan',
  'Dubois',
  'Walsh',
  'Kim',
  'Patel',
  'Meyer',
  'Costa',
  'Nguyen',
  'Allen',
  'Price',
  'Grey',
  'Nunez',
];
export const CITIES: Array<[string, string, string]> = [
  ['Toronto', 'Canada', 'M5V 2T6'],
  ['Austin', 'United States', '78701'],
  ['Brooklyn', 'United States', '11211'],
  ['London', 'United Kingdom', 'E1 6AN'],
  ['Berlin', 'Germany', '10115'],
  ['Amsterdam', 'Netherlands', '1012 AB'],
  ['Lisbon', 'Portugal', '1100-148'],
  ['Melbourne', 'Australia', '3000'],
  ['Madrid', 'Spain', '28004'],
];
export const STREETS = [
  'Queen St W',
  'Congress Ave',
  'Bedford Ave',
  'Brick Ln',
  'Torstrasse',
  'Prinsengracht',
  'Rua Augusta',
  'Collins St',
  'Calle de Fuencarral',
];

function buildStore() {
  const rand = seeded('ecommerce:store');
  const categories: Category[] = CATEGORY_SEED.map(([id, name, parentId], i) => ({
    id,
    name,
    parentId,
    position: i,
    visible: id !== 'cat-home' || true,
  }));

  const products: Product[] = PRODUCT_SEED.map(([name, categoryId, price, vendor], i) => {
    const sizes =
      categoryId.startsWith('cat-run') || categoryId === 'cat-casual'
        ? ['8', '9', '10', '11']
        : categoryId.startsWith('cat-') &&
            ['cat-tops', 'cat-knit', 'cat-outer'].includes(categoryId)
          ? ['S', 'M', 'L', 'XL']
          : ['One size'];
    const sku = `${vendor.slice(0, 2).toUpperCase()}-${(1000 + i * 7).toString()}`;
    const variants = sizes.map((size, v) => ({
      id: `var-${i}-${v}`,
      title: size,
      sku: `${sku}-${size.replace(/\s/g, '').toUpperCase()}`,
      price,
      stock: Math.floor(rand() * 60) * (rand() > 0.12 ? 1 : 0),
    }));
    const stock = variants.reduce((s, v) => s + v.stock, 0);
    const status: Product['status'] =
      i === 5 || i === 22 ? 'draft' : i === 27 ? 'archived' : 'active';
    return {
      id: `prod-${(i + 1).toString().padStart(3, '0')}`,
      name,
      handle: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
      sku,
      categoryId,
      vendor,
      status,
      price,
      compareAt: rand() > 0.75 ? money(price * 1.25) : null,
      cost: money(price * (0.32 + rand() * 0.18)),
      stock,
      tags: [
        pick(rand, ['bestseller', 'new', 'sustainable', 'limited']),
        pick(rand, ['fw26', 'core', 'gift']),
      ],
      description: `${name} from ${vendor}. Designed for daily wear, built to last, and backed by our 2-year repair promise.`,
      seoTitle: `${name} | Fieldwork Supply`,
      seoDescription: `Shop the ${name.toLowerCase()} by ${vendor}. Free shipping over $100 and 30-day returns.`,
      rating: money(3.8 + rand() * 1.2),
      reviews: Math.floor(12 + rand() * 340),
      sold: Math.floor(40 + rand() * 900),
      hue: Math.floor(rand() * 360),
      variants,
      updatedAt: NOW - Math.floor(rand() * 40) * DAY,
    };
  });

  const customers: Customer[] = Array.from({ length: 140 }, (_, i) => {
    const first = FIRST[i % FIRST.length]!;
    const last = LAST[(i * 7) % LAST.length]!;
    const [city, country] = CITIES[i % CITIES.length]!;
    const orders = Math.max(1, Math.round(rand() ** 2 * 24));
    const spent = money(orders * (60 + rand() * 140));
    const lastOrderAt = NOW - Math.floor(rand() ** 1.6 * 220) * DAY;
    const segment: Customer['segment'] =
      spent > 1800
        ? 'vip'
        : NOW - lastOrderAt > 120 * DAY
          ? 'at_risk'
          : orders > 2
            ? 'repeat'
            : 'new';
    return {
      id: `cus-${(i + 1).toString().padStart(3, '0')}`,
      name: `${first} ${last}`,
      email: `${first}.${last}${i > 23 ? i : ''}@example.com`.toLowerCase(),
      phone: `+1 555 01${(10 + (i % 89)).toString()}`,
      city,
      country,
      segment,
      orders,
      spent,
      lastOrderAt,
      joinedAt: lastOrderAt - Math.floor(rand() * 700) * DAY,
      acceptsMarketing: rand() > 0.35,
      tags: segment === 'vip' ? ['wholesale-interest'] : [],
      note: '',
    };
  });

  const STATUSES: OrderStatus[] = [
    'pending',
    'processing',
    'processing',
    'shipped',
    'shipped',
    'delivered',
    'delivered',
    'delivered',
    'delivered',
    'cancelled',
    'refunded',
  ];
  const CHANNELS: Order['channel'][] = [
    'online',
    'online',
    'online',
    'pos',
    'marketplace',
    'social',
  ];
  const orders: Order[] = Array.from({ length: 420 }, (_, i) => {
    const customer = customers[Math.floor(rand() ** 1.3 * customers.length)]!;
    const createdAt = NOW - i * (DAY / 3) - Math.floor(rand() * 3_600_000);
    const age = (NOW - createdAt) / DAY;
    let status: OrderStatus = pick(rand, STATUSES);
    if (age < 1.2 && (status === 'delivered' || status === 'shipped')) status = 'pending';
    const lineCount = 1 + Math.floor(rand() ** 2 * 3);
    const items = Array.from({ length: lineCount }, () => {
      const p = products[Math.floor(rand() * products.length)]!;
      const variant = pick(rand, p.variants);
      return {
        productId: p.id,
        name: p.name,
        variant: variant.title,
        sku: variant.sku,
        qty: 1 + Math.floor(rand() ** 3 * 3),
        price: p.price,
        hue: p.hue,
      };
    });
    const subtotal = money(items.reduce((s, it) => s + it.price * it.qty, 0));
    const discount = rand() > 0.8 ? money(subtotal * 0.1) : 0;
    const shipping = subtotal - discount > 100 ? 0 : 8.5;
    const tax = money((subtotal - discount) * 0.08);
    const total = money(subtotal - discount + shipping + tax);
    const [city, country, zip] = CITIES.find((c) => c[0] === customer.city) ?? CITIES[0]!;
    const street = STREETS[CITIES.findIndex((c) => c[0] === city)] ?? STREETS[0]!;
    const carrier = ['shipped', 'delivered'].includes(status)
      ? pick(rand, ['UPS', 'DHL Express', 'FedEx', 'Canada Post'])
      : null;
    const channel = pick(rand, CHANNELS);
    const CHANNEL_TEXT = {
      online: 'the online store',
      pos: 'point of sale',
      marketplace: 'the marketplace',
      social: 'the Instagram shop',
    } as const;
    const events: OrderEvent[] = [
      {
        id: `e-${i}-0`,
        type: 'placed',
        at: createdAt,
        text: `Order placed on ${CHANNEL_TEXT[channel]}`,
      },
    ];
    if (status !== 'pending' && status !== 'cancelled')
      events.push({
        id: `e-${i}-1`,
        type: 'paid',
        at: createdAt + 60_000,
        text: `Payment of $${total.toFixed(2)} captured`,
      });
    if (['processing', 'shipped', 'delivered', 'refunded'].includes(status))
      events.push({
        id: `e-${i}-2`,
        type: 'packed',
        at: createdAt + 0.6 * DAY,
        text: 'Packed at Toronto fulfilment centre',
      });
    if (['shipped', 'delivered'].includes(status))
      events.push({
        id: `e-${i}-3`,
        type: 'shipped',
        at: createdAt + 1.1 * DAY,
        text: `Handed to ${carrier}`,
      });
    if (status === 'delivered')
      events.push({
        id: `e-${i}-4`,
        type: 'delivered',
        at: createdAt + 3.4 * DAY,
        text: 'Delivered, signed by recipient',
      });
    if (status === 'cancelled')
      events.push({
        id: `e-${i}-5`,
        type: 'cancelled',
        at: createdAt + 0.2 * DAY,
        text: 'Cancelled by customer request',
      });
    if (status === 'refunded')
      events.push({
        id: `e-${i}-6`,
        type: 'refund',
        at: createdAt + 4 * DAY,
        text: `Refunded $${total.toFixed(2)}`,
      });
    return {
      id: `ord-${(9420 - i).toString()}`,
      number: `#${(9420 - i).toString()}`,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      channel,
      status,
      payment:
        status === 'refunded'
          ? 'refunded'
          : status === 'pending' || status === 'cancelled'
            ? 'pending'
            : 'paid',
      items,
      subtotal,
      shipping,
      tax,
      discount,
      total,
      refunded: status === 'refunded' ? total : 0,
      createdAt,
      shippingAddress: { line1: `${(12 + i * 3) % 480} ${street}`, city, zip, country },
      paymentMethod: {
        brand: pick(rand, ['Visa', 'Mastercard', 'Amex', 'Apple Pay']),
        last4: (1000 + Math.floor(rand() * 8999)).toString(),
      },
      carrier,
      tracking: carrier
        ? `1Z${Math.floor(rand() * 1e10)
            .toString()
            .padStart(10, '0')}`
        : null,
      events: events.reverse(),
    };
  });

  const REVIEW_TEXT: Array<[number, string, string]> = [
    [
      5,
      'Fits true to size',
      'Ordered my usual size and it is spot on. Material feels premium and has held up after a dozen washes.',
    ],
    [
      4,
      'Great, but runs warm',
      'Really well made. Slightly too warm for early autumn but perfect once it gets colder.',
    ],
    [
      2,
      'Stitching came loose',
      'After three weeks the seam on the left side started to unravel. Support offered a repair, which was nice.',
    ],
    [
      5,
      'Second one I have bought',
      'Bought one for myself last year and one as a gift this year. Still looks new.',
    ],
    [
      3,
      'Colour differs from photos',
      'Nice quality, but the colour is more grey than the olive shown on the site.',
    ],
    [1, 'Arrived damaged', 'Box was crushed and the strap was torn. Waiting on a replacement.'],
    [
      4,
      'Comfortable all day',
      'Wore these on a 12 km city walk with zero issues. Wish there were more colours.',
    ],
    [
      5,
      'Excellent packaging',
      'Plastic-free packaging and a handwritten note. Product is lovely too.',
    ],
  ];
  const reviews: Review[] = Array.from({ length: 36 }, (_, i) => {
    const p = products[(i * 5) % products.length]!;
    const [rating, title, body] = REVIEW_TEXT[i % REVIEW_TEXT.length]!;
    const c = customers[(i * 11) % customers.length]!;
    return {
      id: `rev-${i + 1}`,
      productId: p.id,
      productName: p.name,
      author: c.name,
      rating,
      title,
      body,
      createdAt: NOW - i * 0.7 * DAY,
      status: i < 9 ? 'pending' : rating <= 1 && i % 2 ? 'rejected' : 'approved',
      verified: rand() > 0.25,
    };
  });

  const discounts: Discount[] = [
    {
      id: 'disc-1',
      code: 'WELCOME10',
      type: 'percentage',
      value: 10,
      minSpend: 0,
      status: 'active',
      used: 1284,
      limit: null,
      startsAt: NOW - 300 * DAY,
      endsAt: null,
      appliesTo: 'First order',
    },
    {
      id: 'disc-2',
      code: 'FREESHIP75',
      type: 'free_shipping',
      value: 0,
      minSpend: 75,
      status: 'active',
      used: 3412,
      limit: null,
      startsAt: NOW - 120 * DAY,
      endsAt: null,
      appliesTo: 'All products',
    },
    {
      id: 'disc-3',
      code: 'BFCM25',
      type: 'percentage',
      value: 25,
      minSpend: 0,
      status: 'scheduled',
      used: 0,
      limit: 5000,
      startsAt: NOW + 3 * DAY,
      endsAt: NOW + 7 * DAY,
      appliesTo: 'Sitewide',
    },
    {
      id: 'disc-4',
      code: 'OUTER40',
      type: 'fixed',
      value: 40,
      minSpend: 200,
      status: 'active',
      used: 218,
      limit: 500,
      startsAt: NOW - 20 * DAY,
      endsAt: NOW + 10 * DAY,
      appliesTo: 'Outerwear',
    },
    {
      id: 'disc-5',
      code: 'VIPEARLY',
      type: 'percentage',
      value: 15,
      minSpend: 0,
      status: 'active',
      used: 96,
      limit: 250,
      startsAt: NOW - 5 * DAY,
      endsAt: NOW + 25 * DAY,
      appliesTo: 'VIP customers',
    },
    {
      id: 'disc-6',
      code: 'SUMMER20',
      type: 'percentage',
      value: 20,
      minSpend: 50,
      status: 'expired',
      used: 2210,
      limit: 2500,
      startsAt: NOW - 160 * DAY,
      endsAt: NOW - 90 * DAY,
      appliesTo: 'Summer collection',
    },
    {
      id: 'disc-7',
      code: 'MUGS2FOR1',
      type: 'fixed',
      value: 27,
      minSpend: 54,
      status: 'expired',
      used: 340,
      limit: 400,
      startsAt: NOW - 70 * DAY,
      endsAt: NOW - 40 * DAY,
      appliesTo: 'Stoneware Mug Set',
    },
  ];

  return { categories, products, customers, orders, reviews, discounts };
}

let store: ReturnType<typeof buildStore> | null = null;
export const db = () => (store ??= buildStore());

export const notFound = () => HttpResponse.json({ message: 'Not found' }, { status: 404 });
export const guard = async (request: Request) => {
  await networkDelay();
  const auth = requireAuth(request);
  return 'error' in auth ? auth.error : null;
};

export const E = `${env.API_URL}/ecommerce`;

export const sum = <T>(list: T[], value: (item: T) => number) =>
  money(list.reduce((s, item) => s + value(item), 0));
