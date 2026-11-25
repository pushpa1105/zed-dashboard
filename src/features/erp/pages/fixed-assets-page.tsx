import { Building, Factory, Plus, TrendingDown, Wallet } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { EmptyState } from '@/shared/components/display/empty-state';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { ErrorPanel } from '../components/error-panel';
import { money, moneyCompact, shortDate } from '../lib/money';
import { assetsQuery, useAssets } from '../operations/api/operations-api';
import { AddAssetDialog } from '../operations/components/add-asset-dialog';
import type { Asset } from '../operations/model/operations';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(assetsQuery());
    return null;
  };

const FISCAL_YEAR = 2026;
const ALL = 'all';

/** Annual depreciation for one asset, or the whole register around the current year. */
function scheduleFor(assets: Asset[], selected: Asset | undefined) {
  if (selected) return selected.schedule;
  const byYear = new Map<number, number>();
  for (const asset of assets)
    for (const row of asset.schedule)
      byYear.set(row.year, (byYear.get(row.year) ?? 0) + row.depreciation);
  return [...byYear]
    .filter(([year]) => Math.abs(year - FISCAL_YEAR) <= 5)
    .sort(([a], [b]) => a - b)
    .map(([year, depreciation]) => ({ year, depreciation }));
}

const sumBy = (assets: Asset[], pick: (a: Asset) => number) =>
  assets.reduce((s, a) => s + pick(a), 0);

/** Fixed asset register with book values and the depreciation schedule. */
export default function FixedAssetsPage() {
  const { t } = useTranslation('erp', { keyPrefix: 'assets' });
  const assets = useAssets();
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState(ALL);
  const list = assets.data ?? [];
  const selected = list.find((a) => a.id === selectedId);
  const schedule = scheduleFor(list, selected).map((r) => ({ ...r, year: String(r.year) }));
  const currentIndex = schedule.findIndex((r) => r.year === String(FISCAL_YEAR));

  const kpis = [
    { key: 'cost', icon: Building, value: sumBy(list, (a) => a.cost), color: 'var(--chart-4)' },
    { key: 'book', icon: Wallet, value: sumBy(list, (a) => a.bookValue), color: 'var(--chart-1)' },
    {
      key: 'accumulated',
      icon: Factory,
      value: sumBy(list, (a) => a.accumulated),
      color: 'var(--chart-3)',
    },
    {
      key: 'expense',
      icon: TrendingDown,
      value: sumBy(list, (a) => a.schedule.find((r) => r.year === FISCAL_YEAR)?.depreciation ?? 0),
      color: 'var(--warning)',
    },
  ] as const;

  return (
    <Page
      title={t('title')}
      description={t('description')}
      width="full"
      actions={
        <Button onClick={() => setAdding(true)}>
          <Plus /> {t('add')}
        </Button>
      }
    >
      {assets.isError ? (
        <ErrorPanel onRetry={() => void assets.refetch()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <StatCard
                key={kpi.key}
                variant="tile"
                icon={kpi.icon}
                color={kpi.color}
                label={t(`kpis.${kpi.key}`, { year: FISCAL_YEAR })}
                value={moneyCompact(kpi.value)}
                loading={!assets.data}
              />
            ))}
          </div>

          <SectionCard
            title={t('chart.title')}
            description={selected ? selected.name : t('chart.portfolio')}
            action={
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="w-56" aria-label={t('chart.scope')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value={ALL}>{t('chart.allAssets')}</SelectItem>
                  {list.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          >
            {assets.data ? (
              <BarChart
                className="h-72"
                data={schedule}
                xKey="year"
                series={[{ key: 'depreciation', label: t('chart.depreciation') }]}
                highlight={currentIndex >= 0 ? currentIndex : undefined}
                valueFormatter={moneyCompact}
              />
            ) : (
              <Skeleton className="h-72 w-full" />
            )}
          </SectionCard>

          <SectionCard flush title={t('register.title')} description={t('register.description')}>
            {!assets.data ? (
              <div className="space-y-2 px-6 pb-6">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-11 w-full" />
                ))}
              </div>
            ) : list.length === 0 ? (
              <EmptyState className="border-t" title={t('register.empty')} />
            ) : (
              <div className="border-t">
                <Table aria-label={t('register.title')}>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">{t('columns.asset')}</TableHead>
                      <TableHead className="hidden md:table-cell">
                        {t('columns.acquired')}
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">{t('columns.method')}</TableHead>
                      <TableHead className="hidden text-right sm:table-cell">
                        {t('columns.cost')}
                      </TableHead>
                      <TableHead className="hidden text-right lg:table-cell">
                        {t('columns.accumulated')}
                      </TableHead>
                      <TableHead className="pr-6 text-right">{t('columns.bookValue')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((a) => (
                      <TableRow
                        key={a.id}
                        className={cn('cursor-pointer', a.id === selectedId && 'bg-primary/5')}
                        aria-selected={a.id === selectedId}
                        onClick={() => setSelectedId(a.id === selectedId ? ALL : a.id)}
                      >
                        <TableCell className="pl-6">
                          <p className="font-medium">{a.name}</p>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-mono">{a.id}</span> ·{' '}
                            {t(`categories.${a.category}`)} · {a.location}
                          </p>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {shortDate(a.acquired)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <p>{t(`methods.${a.method}`)}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('years', { count: a.usefulLife })}
                          </p>
                        </TableCell>
                        <TableCell className="hidden text-right tabular-nums sm:table-cell">
                          {money(a.cost)}
                        </TableCell>
                        <TableCell className="hidden text-right text-muted-foreground tabular-nums lg:table-cell">
                          ({money(a.accumulated)})
                        </TableCell>
                        <TableCell className="pr-6 text-right font-medium tabular-nums">
                          {money(a.bookValue)}
                          {a.bookValue <= a.salvage && (
                            <p className="text-xs font-normal text-muted-foreground">
                              {t('fullyDepreciated')}
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>
        </>
      )}

      <AddAssetDialog open={adding} onOpenChange={setAdding} />
    </Page>
  );
}
