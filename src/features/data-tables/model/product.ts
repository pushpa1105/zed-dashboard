/** Inventory rows for the AG Grid example (generated in the browser). */
export type Product = {
  id: string;
  sku: string;
  product: string;
  category: string;
  stock: number;
  price: number;
  rating: number;
  updated: string;
};

const ADJ = [
  'Aero',
  'Nova',
  'Terra',
  'Lumen',
  'Vale',
  'Orbit',
  'Pulse',
  'Drift',
  'Fjord',
  'Cinder',
];
const NOUN: Record<string, string[]> = {
  Audio: ['Headphones', 'Speaker', 'Earbuds', 'Soundbar'],
  Home: ['Lamp', 'Kettle', 'Diffuser', 'Throw blanket'],
  Office: ['Desk mat', 'Monitor arm', 'Notebook', 'Chair cushion'],
  Outdoor: ['Backpack', 'Water bottle', 'Camp stove', 'Rain shell'],
  Wearables: ['Watch band', 'Fitness ring', 'Smart watch', 'Sleep mask'],
};

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateProducts(count: number, seed = 7): Product[] {
  const rand = mulberry32(seed);
  const categories = Object.keys(NOUN);
  const start = Date.UTC(2026, 5, 1);
  return Array.from({ length: count }, (_, i) => {
    const category = categories[Math.floor(rand() * categories.length)]!;
    const nouns = NOUN[category]!;
    return {
      id: `p_${i}`,
      sku: `${category.slice(0, 3).toUpperCase()}-${(1000 + i).toString()}`,
      product: `${ADJ[Math.floor(rand() * ADJ.length)]} ${nouns[Math.floor(rand() * nouns.length)]}`,
      category,
      stock: Math.floor(rand() ** 1.6 * 500),
      price: Math.round((9 + rand() * 290) * 100) / 100,
      rating: Math.round((2.8 + rand() * 2.2) * 10) / 10,
      updated: new Date(start + Math.floor(rand() * 170) * 86_400_000).toISOString().slice(0, 10),
    };
  });
}

/** Stock at or below this is flagged as low. */
export const LOW_STOCK = 40;
