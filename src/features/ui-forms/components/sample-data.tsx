import {
  Briefcase,
  Code2,
  HeartPulse,
  Landmark,
  Megaphone,
  Palette,
  ShoppingBag,
  Truck,
} from 'lucide-react';

import type { SelectOption } from '@/shared/components/forms/options';
import type { TreeNode } from '@/shared/components/forms/tree-select';

/** Demo data for the showcase pages. Replace with your own lookups. */

export const INDUSTRIES: SelectOption[] = [
  { value: 'saas', label: 'Software & SaaS', icon: <Code2 />, group: 'Technology' },
  { value: 'fintech', label: 'Financial services', icon: <Landmark />, group: 'Technology' },
  { value: 'health', label: 'Healthcare', icon: <HeartPulse />, group: 'Services' },
  { value: 'agency', label: 'Agency & consulting', icon: <Briefcase />, group: 'Services' },
  { value: 'design', label: 'Design studio', icon: <Palette />, group: 'Services' },
  { value: 'retail', label: 'Retail & e-commerce', icon: <ShoppingBag />, group: 'Commerce' },
  { value: 'logistics', label: 'Logistics', icon: <Truck />, group: 'Commerce' },
  { value: 'media', label: 'Media & marketing', icon: <Megaphone />, group: 'Commerce' },
];

export const TEAM_OPTIONS: SelectOption[] = [
  { value: 'design', label: 'Design', description: 'Product & brand', group: 'Product' },
  {
    value: 'engineering',
    label: 'Engineering',
    description: 'Web, mobile, platform',
    group: 'Product',
  },
  { value: 'data', label: 'Data', description: 'Analytics & ML', group: 'Product' },
  { value: 'sales', label: 'Sales', description: 'New business', group: 'Go-to-market' },
  {
    value: 'marketing',
    label: 'Marketing',
    description: 'Growth & content',
    group: 'Go-to-market',
  },
  { value: 'success', label: 'Customer success', group: 'Go-to-market' },
  { value: 'finance', label: 'Finance', group: 'Operations' },
  { value: 'people', label: 'People', group: 'Operations' },
  {
    value: 'legal',
    label: 'Legal',
    description: 'Contracts & compliance',
    group: 'Operations',
    disabled: true,
  },
];

export const FRAMEWORKS: SelectOption[] = [
  'React',
  'Vue',
  'Svelte',
  'Angular',
  'Solid',
  'Qwik',
  'Astro',
  'Next.js',
  'Remix',
  'Nuxt',
].map((label) => ({ value: label.toLowerCase().replace(/\W/g, ''), label }));

export const LOCATIONS: TreeNode[] = [
  {
    value: 'emea',
    label: 'EMEA',
    children: [
      {
        value: 'uk',
        label: 'United Kingdom',
        children: [
          { value: 'london', label: 'London' },
          { value: 'manchester', label: 'Manchester' },
        ],
      },
      {
        value: 'de',
        label: 'Germany',
        children: [
          { value: 'berlin', label: 'Berlin' },
          { value: 'munich', label: 'Munich' },
        ],
      },
      {
        value: 'es',
        label: 'Spain',
        children: [
          { value: 'madrid', label: 'Madrid' },
          { value: 'barcelona', label: 'Barcelona' },
        ],
      },
    ],
  },
  {
    value: 'amer',
    label: 'Americas',
    children: [
      {
        value: 'us',
        label: 'United States',
        children: [
          { value: 'nyc', label: 'New York' },
          { value: 'sf', label: 'San Francisco' },
          { value: 'austin', label: 'Austin' },
        ],
      },
      { value: 'br', label: 'Brazil', children: [{ value: 'sao-paulo', label: 'São Paulo' }] },
    ],
  },
  {
    value: 'apac',
    label: 'APAC',
    children: [
      {
        value: 'np',
        label: 'Nepal',
        children: [
          { value: 'kathmandu', label: 'Kathmandu' },
          { value: 'pokhara', label: 'Pokhara' },
        ],
      },
      { value: 'jp', label: 'Japan', children: [{ value: 'tokyo', label: 'Tokyo' }] },
    ],
  },
];

export const PERMISSIONS: SelectOption[] = [
  { value: 'billing.read', label: 'View billing' },
  { value: 'billing.write', label: 'Manage billing' },
  { value: 'members.read', label: 'View members' },
  { value: 'members.invite', label: 'Invite members' },
  { value: 'members.remove', label: 'Remove members' },
  { value: 'projects.create', label: 'Create projects' },
  { value: 'projects.delete', label: 'Delete projects', disabled: true },
  { value: 'reports.export', label: 'Export reports' },
  { value: 'audit.read', label: 'Read audit log' },
];

export const PEOPLE: SelectOption[] = [
  { value: 'hannah', label: 'Hannah Morgan' },
  { value: 'megan', label: 'Megan Clark' },
  { value: 'ivan', label: 'Ivan Serhin' },
  { value: 'james', label: 'James Anderson' },
  { value: 'priya', label: 'Priya Patel' },
  { value: 'diego', label: 'Diego García' },
];
