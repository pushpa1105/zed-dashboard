import type { NavSection } from '@/core/feature/define-feature';

import { findActiveTrail } from '../registry';

const label = () => '';
const all = { to: '/shop/orders', label };
const pending = { to: '/shop/orders?status=pending', label };
const orders = { label, children: [all, pending] };
const sections: NavSection[] = [{ id: 'main', items: [{ to: '/shop', label }, orders] }];

const leaf = (pathname: string, search = '') =>
  findActiveTrail(sections, pathname, ['/shop'], search).at(-1);

describe('findActiveTrail', () => {
  it('prefers the link whose query matches the URL', () => {
    expect(leaf('/shop/orders', '?status=pending')).toBe(pending);
  });

  it('falls back to the plain link for other queries', () => {
    expect(leaf('/shop/orders')).toBe(all);
    expect(leaf('/shop/orders', '?status=shipped')).toBe(all);
  });

  it('keeps the parent of a nested detail page active', () => {
    expect(findActiveTrail(sections, '/shop/orders/42', ['/shop'])).toEqual([orders, all]);
  });
});
