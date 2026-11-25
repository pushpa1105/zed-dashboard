import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { DonutChart } from '@/shared/components/charts/donut-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { RatingStars } from '@/shared/components/display/rating-stars';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { useVendors, vendorsQuery } from '../api/erp-api';
import { ErrorPanel } from '../components/error-panel';
import { money, moneyCompact } from '../lib/money';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(vendorsQuery());
    return null;
  };

/** Vendor directory with spend mix, top suppliers and open balances. */
export default function VendorsPage() {
  const { t } = useTranslation('erp', { keyPrefix: 'vendors' });
  const vendors = useVendors();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const data = useMemo(() => vendors.data ?? [], [vendors.data]);

  const categories = useMemo(() => {
    const totals = new Map<string, number>();
    data.forEach((v) => totals.set(v.category, (totals.get(v.category) ?? 0) + v.ytdSpend));
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [data]);
  const donut = [
    ...categories
      .slice(0, 4)
      .map(([key, value]) => ({ key: key.toLowerCase(), label: key, value })),
    {
      key: 'other',
      label: t('other'),
      value: categories.slice(4).reduce((s, [, v]) => s + v, 0),
    },
  ].filter((d) => d.value > 0);
  const top = [...data].sort((a, b) => b.ytdSpend - a.ytdSpend).slice(0, 5);
  const topMax = top[0]?.ytdSpend ?? 1;

  const rows = data.filter(
    (v) =>
      (category === 'all' || v.category === category) &&
      (!query || `${v.name} ${v.contact} ${v.email}`.toLowerCase().includes(query.toLowerCase())),
  );

  if (vendors.isError) {
    return (
      <Page title={t('title')} width="full">
        <ErrorPanel onRetry={() => void vendors.refetch()} />
      </Page>
    );
  }

  return (
    <Page title={t('title')} description={t('description')} width="full">
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title={t('mix.title')} description={t('mix.description')}>
          {vendors.data ? (
            <DonutChart data={donut} valueFormatter={moneyCompact} centerLabel={t('mix.ytd')} />
          ) : (
            <Skeleton className="h-56 w-full" />
          )}
        </SectionCard>
        <SectionCard title={t('top.title')} description={t('top.description')}>
          {vendors.data ? (
            <ol className="space-y-4">
              {top.map((v, i) => (
                <li key={v.id} className="flex items-center gap-3">
                  <span className="w-4 text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                  <InitialsAvatar name={v.name} size="sm" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{v.name}</span>
                      <span className="tabular-nums">{moneyCompact(v.ytdSpend)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(v.ytdSpend / topMax) * 100}%` }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <Skeleton className="h-56 w-full" />
          )}
        </SectionCard>
      </div>

      <SectionCard flush title={t('list.title', { count: rows.length })}>
        <div className="flex flex-col gap-3 border-y bg-muted/30 px-6 py-3 md:flex-row md:items-center">
          <div className="relative md:w-72">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search')}
              aria-label={t('search')}
              className="bg-background pl-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full bg-background md:w-56" aria-label={t('category')}>
              <span className="text-muted-foreground">{t('category')}:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all')}</SelectItem>
              {categories.map(([name]) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Table aria-label={t('list.title', { count: rows.length })}>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">{t('columns.vendor')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('columns.contact')}</TableHead>
              <TableHead>{t('columns.terms')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('columns.rating')}</TableHead>
              <TableHead className="text-right">{t('columns.onTime')}</TableHead>
              <TableHead className="text-right">{t('columns.balance')}</TableHead>
              <TableHead className="pr-6">{t('columns.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!vendors.data &&
              Array.from({ length: 6 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7} className="px-6">
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {rows.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="pl-6">
                  <div className="flex items-center gap-3">
                    <InitialsAvatar name={v.name} size="sm" />
                    <div>
                      <p className="font-medium">{v.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.category} · {v.country}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <p>{v.contact}</p>
                  <p className="text-xs text-muted-foreground">{v.email}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">{v.terms}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <RatingStars value={v.rating} size="sm" />
                </TableCell>
                <TableCell className="text-right tabular-nums">{v.onTimeRate}%</TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {money(v.balance)}
                </TableCell>
                <TableCell className="pr-6">
                  <StatusBadge
                    status={v.status === 'active' ? 'active' : 'pending'}
                    label={t(`status.${v.status}`)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </Page>
  );
}
