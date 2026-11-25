import { http, HttpResponse, type HttpHandler } from 'msw';

import { errorResponse } from '../utils';

import type { Deal, Person } from './crm';
import { authorize, crmUrl as url, DAY, fullName, iso, seededHelpers, today } from './crm-seed';

type Category = 'platform' | 'addon' | 'services' | 'support';
type Product = {
  id: string;
  sku: string;
  name: string;
  category: Category;
  listPrice: number;
  cost: number;
  active: boolean;
};
type ProductInput = Omit<Product, 'id'>;

type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined';
type QuoteLine = { productId: string; name: string; quantity: number; unitPrice: number };
type QuoteDraft = { lines: QuoteLine[]; discountPct: number; taxRate: number };
type Quote = QuoteDraft & {
  id: string;
  number: string;
  title: string;
  dealId: string;
  company: string;
  contact: string;
  owner: string;
  status: QuoteStatus;
  createdAt: string;
  validUntil: string;
};

const { rand, pick, between } = seededHelpers(3131);

/** Name, list price and the margin range typical for the category. */
const CATALOG: Record<Category, { margin: [number, number]; items: [string, number][] }> = {
  platform: {
    margin: [78, 90],
    items: [
      ['Platform · Starter (25 seats)', 9_600],
      ['Platform · Growth (100 seats)', 28_000],
      ['Platform · Enterprise (500 seats)', 96_000],
      ['Extra seats (25)', 2_500],
    ],
  },
  addon: {
    margin: [70, 85],
    items: [
      ['Analytics add-on', 6_400],
      ['Advanced routing', 4_200],
      ['SSO & audit log', 3_600],
      ['EU data residency', 5_000],
      ['API access · high volume', 7_800],
    ],
  },
  services: {
    margin: [25, 45],
    items: [
      ['Onboarding package', 3_200],
      ['Data migration', 5_500],
      ['Custom integration (per day)', 1_400],
      ['Admin training workshop', 2_200],
    ],
  },
  support: {
    margin: [45, 65],
    items: [
      ['Premium support', 4_800],
      ['Dedicated success manager', 12_000],
      ['24/7 incident response', 9_000],
    ],
  },
};

const products: Product[] = Object.entries(CATALOG)
  .flatMap(([category, { margin, items }]) =>
    items.map(([name, listPrice]) => ({ category: category as Category, name, listPrice, margin })),
  )
  .map(({ category, name, listPrice, margin }, i) => ({
    id: `prd-${i + 1}`,
    sku: `${category.slice(0, 3).toUpperCase()}-${101 + i}`,
    name,
    category,
    listPrice,
    cost: Math.round((listPrice * (100 - between(...margin))) / 100),
    active: rand() > 0.12,
  }));

const lineFor = (product: Product, quantity = 1): QuoteLine => ({
  productId: product.id,
  name: product.name,
  quantity,
  unitPrice: product.listPrice,
});

const quoteTotal = ({ lines, discountPct, taxRate }: QuoteDraft) => {
  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const net = subtotal * (1 - discountPct / 100);
  return Math.round(net * (1 + taxRate / 100) * 100) / 100;
};
const withTotal = (quote: Quote) => ({ ...quote, total: quoteTotal(quote) });

const NEXT_STATUS: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ['sent'],
  sent: ['accepted', 'declined'],
  accepted: [],
  declined: [],
};

const STATUS_BY_STAGE: Partial<Record<Deal['stage'], QuoteStatus[]>> = {
  proposal: ['draft', 'sent', 'sent'],
  negotiation: ['sent'],
  won: ['accepted'],
  lost: ['declined'],
};

export function createQuoteHandlers({ deals, people }: { deals: Deal[]; people: Person[] }) {
  const now = today();
  const contactOf = (deal: Deal) => people.find((p) => p.id === deal.contactId)?.name ?? '—';
  const quotes: Quote[] = [];

  const addQuote = (deal: Deal, status: QuoteStatus, createdAt: number, validDays = 30) => {
    const quote: Quote = {
      id: `q-${2001 + quotes.length}`,
      number: `Q-${new Date(createdAt).getFullYear()}-${String(141 + quotes.length).padStart(4, '0')}`,
      title: deal.name,
      dealId: deal.id,
      company: deal.company,
      contact: contactOf(deal),
      owner: deal.owner,
      status,
      lines: [],
      discountPct: 0,
      taxRate: 0,
      createdAt: iso(createdAt),
      validUntil: iso(createdAt + validDays * DAY),
    };
    quotes.unshift(quote);
    return quote;
  };

  deals.forEach((deal) => {
    const statuses = STATUS_BY_STAGE[deal.stage];
    if (!statuses) return;
    const quote = addQuote(deal, pick(statuses), now - between(2, 50) * DAY);
    const picked = new Set(Array.from({ length: between(1, 4) }, () => pick(products)));
    quote.lines = [...picked].map((p) => lineFor(p, p.category === 'platform' ? 1 : between(1, 4)));
    quote.discountPct = pick([0, 0, 5, 10, 15]);
    quote.taxRate = pick([0, 7.5, 10, 20]);
  });

  return [
    http.get(url('/products'), async ({ request }) => {
      const auth = await authorize(request);
      if ('error' in auth) return auth.error;
      return HttpResponse.json(products);
    }),

    http.post<never, ProductInput>(url('/products'), async ({ request }) => {
      const auth = await authorize(request);
      if ('error' in auth) return auth.error;
      const product = { ...(await request.json()), id: `prd-${products.length + 1}` };
      products.push(product);
      return HttpResponse.json(product);
    }),

    http.patch<{ id: string }, Partial<ProductInput>>(
      url('/products/:id'),
      async ({ request, params }) => {
        const auth = await authorize(request);
        if ('error' in auth) return auth.error;
        const product = products.find((p) => p.id === params.id);
        if (!product) return errorResponse('Product not found', 404);
        return HttpResponse.json(Object.assign(product, await request.json()));
      },
    ),

    http.get(url('/quotes'), async ({ request }) => {
      const auth = await authorize(request);
      if ('error' in auth) return auth.error;
      return HttpResponse.json(quotes.map(withTotal));
    }),

    http.get<{ id: string }>(url('/quotes/:id'), async ({ request, params }) => {
      const auth = await authorize(request);
      if ('error' in auth) return auth.error;
      const quote = quotes.find((q) => q.id === params.id);
      if (!quote) return errorResponse('Quote not found', 404);
      return HttpResponse.json(withTotal(quote));
    }),

    http.post<never, { dealId: string; validDays: number }>(url('/quotes'), async ({ request }) => {
      const auth = await authorize(request);
      if ('error' in auth) return auth.error;
      const { dealId, validDays } = await request.json();
      const deal = deals.find((d) => d.id === dealId);
      if (!deal) return errorResponse('Deal not found', 404);
      const quote = addQuote(deal, 'draft', Date.now(), validDays);
      quote.owner = fullName(auth.user);
      quote.lines = [lineFor(products.find((p) => p.active)!)];
      return HttpResponse.json(withTotal(quote));
    }),

    http.put<{ id: string }, QuoteDraft>(url('/quotes/:id'), async ({ request, params }) => {
      const auth = await authorize(request);
      if ('error' in auth) return auth.error;
      const quote = quotes.find((q) => q.id === params.id);
      if (!quote) return errorResponse('Quote not found', 404);
      if (quote.status !== 'draft') return errorResponse('Only drafts can be edited', 409);
      return HttpResponse.json(withTotal(Object.assign(quote, await request.json())));
    }),

    http.patch<{ id: string }, { status: QuoteStatus }>(
      url('/quotes/:id'),
      async ({ request, params }) => {
        const auth = await authorize(request);
        if ('error' in auth) return auth.error;
        const quote = quotes.find((q) => q.id === params.id);
        if (!quote) return errorResponse('Quote not found', 404);
        const { status } = await request.json();
        if (!NEXT_STATUS[quote.status].includes(status))
          return errorResponse('Invalid status change', 409);
        quote.status = status;
        const deal = deals.find((d) => d.id === quote.dealId);
        if (deal && status === 'accepted') Object.assign(deal, { stage: 'won', probability: 100 });
        return HttpResponse.json(withTotal(quote));
      },
    ),
  ] satisfies HttpHandler[];
}
