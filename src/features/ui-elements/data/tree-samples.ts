import {
  Building2,
  Code2,
  Headphones,
  Megaphone,
  Palette,
  PiggyBank,
  Scale,
  Server,
  ShoppingCart,
  Users,
} from 'lucide-react';

import type { OrgNode } from '@/shared/components/tree/org-chart';
import type { TreeTableRow } from '@/shared/components/tree/tree-table';
import type { TreeItem } from '@/shared/components/tree/tree-utils';

export const departments: TreeItem[] = [
  {
    id: 'product',
    label: 'Product & Engineering',
    icon: Code2,
    meta: 64,
    children: [
      {
        id: 'platform',
        label: 'Platform',
        icon: Server,
        meta: 22,
        children: [
          { id: 'infra', label: 'Infrastructure', meta: 9 },
          { id: 'data', label: 'Data engineering', meta: 7 },
          { id: 'sre', label: 'Site reliability', meta: 6 },
        ],
      },
      {
        id: 'apps',
        label: 'Applications',
        icon: Code2,
        meta: 30,
        children: [
          { id: 'web', label: 'Web', meta: 14 },
          { id: 'mobile', label: 'Mobile', meta: 10 },
          { id: 'payments', label: 'Payments', meta: 6, disabled: true },
        ],
      },
      { id: 'design', label: 'Design', icon: Palette, meta: 12 },
    ],
  },
  {
    id: 'gtm',
    label: 'Go-to-market',
    icon: Megaphone,
    meta: 41,
    children: [
      {
        id: 'sales',
        label: 'Sales',
        icon: ShoppingCart,
        meta: 24,
        children: [
          { id: 'emea', label: 'EMEA', meta: 9 },
          { id: 'na', label: 'North America', meta: 11 },
          { id: 'apac', label: 'APAC', meta: 4 },
        ],
      },
      { id: 'marketing', label: 'Marketing', icon: Megaphone, meta: 10 },
      { id: 'support', label: 'Customer support', icon: Headphones, meta: 7 },
    ],
  },
  {
    id: 'ops',
    label: 'Operations',
    icon: Building2,
    meta: 18,
    children: [
      { id: 'finance', label: 'Finance', icon: PiggyBank, meta: 8 },
      { id: 'legal', label: 'Legal', icon: Scale, meta: 4 },
      { id: 'people', label: 'People', icon: Users, meta: 6 },
    ],
  },
];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Regions whose cities load on demand (simulated latency). */
export const lazyRegions: TreeItem[] = [
  ['eu', 'Europe', ['Lisbon', 'Berlin', 'Warsaw', 'Dublin']],
  ['na', 'North America', ['Toronto', 'Austin', 'Denver']],
  ['sa', 'South America', ['São Paulo', 'Bogotá']],
  ['ap', 'Asia Pacific', ['Singapore', 'Sydney', 'Seoul', 'Bengaluru']],
].map(([id, label, cities]) => ({
  id: id as string,
  label: label as string,
  meta: `${(cities as string[]).length} sites`,
  loadChildren: async () => {
    await wait(900);
    return (cities as string[]).map((city) => ({
      id: `${id}-${city}`,
      label: city,
      meta: `${8 + city.length * 3} people`,
    }));
  },
}));

export const projectFiles: TreeItem[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      {
        id: 'src/app',
        label: 'app',
        children: [
          { id: 'src/app/router.tsx', label: 'router.tsx', meta: '2.1 KB' },
          { id: 'src/app/providers.tsx', label: 'providers.tsx', meta: '1.4 KB' },
        ],
      },
      {
        id: 'src/features',
        label: 'features',
        children: [
          {
            id: 'src/features/orders',
            label: 'orders',
            children: [
              { id: 'orders/index.ts', label: 'index.ts', meta: '0.8 KB' },
              { id: 'orders/schema.json', label: 'schema.json', meta: '3.2 KB' },
              { id: 'orders/README.md', label: 'README.md', meta: '1.1 KB' },
            ],
          },
        ],
      },
      { id: 'src/styles.css', label: 'styles.css', meta: '6.4 KB' },
    ],
  },
  {
    id: 'assets',
    label: 'assets',
    children: [
      { id: 'assets/logo.svg', label: 'logo.svg', meta: '4 KB' },
      { id: 'assets/hero.png', label: 'hero.png', meta: '412 KB' },
      { id: 'assets/pricing.pdf', label: 'pricing.pdf', meta: '1.8 MB' },
    ],
  },
  { id: 'export.csv', label: 'export.csv', meta: '88 KB' },
  { id: 'package.json', label: 'package.json', meta: '2.6 KB' },
];

export type BudgetRow = { name: string; budget: number; actual: number };

export const budgetRows: Array<TreeTableRow<BudgetRow>> = [
  {
    id: 'opex',
    name: 'Operating expenses',
    budget: 1_240_000,
    actual: 1_187_400,
    children: [
      {
        id: 'people',
        name: 'People',
        budget: 820_000,
        actual: 806_150,
        children: [
          { id: 'salaries', name: 'Salaries', budget: 700_000, actual: 698_200 },
          { id: 'benefits', name: 'Benefits', budget: 92_000, actual: 84_950 },
          { id: 'training', name: 'Training', budget: 28_000, actual: 23_000 },
        ],
      },
      {
        id: 'software',
        name: 'Software',
        budget: 180_000,
        actual: 196_300,
        children: [
          { id: 'cloud', name: 'Cloud hosting', budget: 120_000, actual: 138_900 },
          { id: 'saas', name: 'SaaS tools', budget: 60_000, actual: 57_400 },
        ],
      },
      { id: 'office', name: 'Office & travel', budget: 240_000, actual: 184_950 },
    ],
  },
  {
    id: 'capex',
    name: 'Capital expenses',
    budget: 310_000,
    actual: 262_800,
    children: [
      { id: 'hardware', name: 'Hardware', budget: 190_000, actual: 171_300 },
      { id: 'fitout', name: 'Office fit-out', budget: 120_000, actual: 91_500 },
    ],
  },
];

export const orgRoot: OrgNode = {
  id: 'ceo',
  name: 'Amara Okafor',
  title: 'Chief Executive Officer',
  reports: [
    {
      id: 'cto',
      name: 'Tomás Reyes',
      title: 'CTO',
      reports: [
        { id: 'eng1', name: 'Priya Natarajan', title: 'Head of Platform' },
        { id: 'eng2', name: 'Jonas Becker', title: 'Head of Apps' },
      ],
    },
    {
      id: 'cro',
      name: 'Hannah Morgan',
      title: 'Chief Revenue Officer',
      reports: [
        { id: 's1', name: 'Diego Haddad', title: 'Sales, EMEA' },
        { id: 's2', name: 'Grace Liu', title: 'Sales, Americas' },
        { id: 's3', name: 'Noah Morgan', title: 'Customer Success' },
      ],
    },
    {
      id: 'cfo',
      name: 'Samuel Adeyemi',
      title: 'CFO',
      reports: [{ id: 'f1', name: 'Ines Duarte', title: 'Controller' }],
    },
  ],
};
