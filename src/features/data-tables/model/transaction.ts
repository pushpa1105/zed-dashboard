import {
  ORDER_CHANNELS,
  ORDER_COUNTRIES,
  ORDER_STATUSES,
  type OrderChannel,
  type OrderStatus,
} from './order';

/** A row of the client-side example (generated in the browser, never fetched). */
export type Transaction = {
  id: string;
  reference: string;
  customer: string;
  country: string;
  status: OrderStatus;
  channel: OrderChannel;
  amount: number;
  quantity: number;
  date: string;
  notes: string;
};

const FIRST = [
  'Hannah',
  'Megan',
  'Lucas',
  'Amara',
  'Noah',
  'Priya',
  'Mateo',
  'Yuki',
  'Elena',
  'Omar',
  'Chloe',
  'Kofi',
  'Sofia',
  'Liam',
  'Ines',
  'Arjun',
];
const LAST = [
  'Morgan',
  'Clark',
  'Silva',
  'Okafor',
  'Becker',
  'Sharma',
  'Rossi',
  'Tanaka',
  'Novak',
  'Haddad',
  'Dubois',
  'Mensah',
];
const NOTES = [
  '',
  '',
  '',
  'Gift wrap',
  'Leave at reception',
  'Priority',
  'Call before delivery',
  'Repeat customer',
  '',
];

/** Seeded PRNG: the same 10,000 rows on every load. */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateTransactions(count: number, seed = 42): Transaction[] {
  const rand = mulberry32(seed);
  const pick = <T>(list: readonly T[]) => list[Math.floor(rand() * list.length)]!;
  const start = Date.UTC(2025, 11, 1);
  return Array.from({ length: count }, (_, i) => {
    const quantity = 1 + Math.floor(rand() ** 2 * 12);
    return {
      id: `tx_${i}`,
      reference: `TX-${(240_000 + i).toString(36).toUpperCase()}`,
      customer: `${pick(FIRST)} ${pick(LAST)}`,
      country: pick(ORDER_COUNTRIES),
      status: pick(ORDER_STATUSES),
      channel: pick(ORDER_CHANNELS),
      amount: Math.round(quantity * (8 + rand() * 120) * 100) / 100,
      quantity,
      date: new Date(start + Math.floor(rand() * 360) * 86_400_000).toISOString().slice(0, 10),
      notes: pick(NOTES),
    };
  });
}
