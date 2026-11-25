import { Star } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { seriesColor } from '@/shared/components/charts/series';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { getInitials } from '@/shared/lib/format';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';

import type { EcommerceOverview } from '../model/overview';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function RatingsCard({ ratings }: { ratings: EcommerceOverview['ratings'] }) {
  const { t } = useTranslation('ecommerce', { keyPrefix: 'overview' });

  return (
    <SectionCard title={t('ratings.title')} description={t('ratings.description')}>
      <ul className="divide-y">
        {ratings.map((customer) => {
          const [first, last] = customer.name.split(' ');
          return (
            <li key={customer.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <Avatar className="size-9 rounded-lg">
                <AvatarFallback className="rounded-lg bg-secondary text-xs font-medium text-secondary-foreground">
                  {getInitials(first, last)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{customer.name}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="size-3 fill-warning text-warning" aria-hidden />
                  <span className="tabular-nums">{customer.rating.toFixed(1)}</span>
                  <span aria-hidden>·</span>
                  {t('ratings.orders', { count: customer.orders })}
                </p>
              </div>
              <span className="text-sm font-semibold text-primary tabular-nums">
                {usd.format(customer.spent)}
              </span>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

/** Tinted pill rows with a count chip, one per follow-up queue. */
export function SummaryCard({ items }: { items: EcommerceOverview['summary'] }) {
  const { t } = useTranslation('ecommerce', { keyPrefix: 'overview' });

  return (
    <SectionCard title={t('summary.title')}>
      <ul className="space-y-2.5">
        {items.map((item, i) => {
          const color = seriesColor(i);
          return (
            <li key={item.key}>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: `color-mix(in srgb, ${color} 11%, transparent)` }}
              >
                <span
                  className="size-2 rounded-full ring-2 ring-current/20"
                  style={{ background: color }}
                />
                <span className="flex-1">{item.label}</span>
                <span className="rounded-md bg-card px-2 py-0.5 text-xs tabular-nums shadow-xs">
                  {item.count.toLocaleString('en-US')}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
