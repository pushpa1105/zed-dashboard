import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link } from '@/core/router/router';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { LineChart } from '@/shared/components/charts/line-chart';
import { Sparkline } from '@/shared/components/charts/sparkline';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { cn } from '@/shared/lib/cn';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { suppliersQuery, useSuppliers } from '../api/inventory-api';
import { ErrorPanel } from '../components/error-panel';
import { lastMonths, usdCompact } from '../lib/format';
import { inventoryRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(suppliersQuery());
    return null;
  };

const rateClass = (rate: number) =>
  rate >= 95 ? 'text-success' : rate >= 85 ? 'text-foreground' : 'text-destructive';

/** Supplier performance: lead times (now and trend), reliability and spend. */
export default function SuppliersPage() {
  const { t } = useTranslation('inventory', { keyPrefix: 'suppliers' });
  const suppliers = useSuppliers();
  const data = suppliers.data ?? [];
  const [focus, setFocus] = useState<string | null>(null);
  const months = lastMonths(6);
  const focused =
    data.find((s) => s.id === focus) ??
    [...data].sort((a, b) => b.leadTimeDays - a.leadTimeDays)[0];

  if (suppliers.isError) {
    return (
      <Page title={t('title')} width="full">
        <ErrorPanel onRetry={() => void suppliers.refetch()} />
      </Page>
    );
  }

  return (
    <Page title={t('title')} description={t('description')} width="full">
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title={t('lead.title')} description={t('lead.description')}>
          {suppliers.data ? (
            <BarChart
              className="h-80"
              horizontal
              data={[...data]
                .sort((a, b) => b.leadTimeDays - a.leadTimeDays)
                .map((s) => ({
                  name: s.name.split(' ').slice(0, 2).join(' '),
                  days: s.leadTimeDays,
                }))}
              xKey="name"
              series={[{ key: 'days', label: t('lead.days') }]}
              barSize={16}
              valueFormatter={(v) => `${v}d`}
            />
          ) : (
            <Skeleton className="h-80 w-full" />
          )}
        </SectionCard>
        <SectionCard
          title={t('trend.title', { name: focused?.name ?? '' })}
          description={t('trend.description')}
        >
          {focused ? (
            <LineChart
              className="h-80"
              data={focused.leadTimeTrend.map((days, i) => ({
                month: months[i]!,
                days,
                quoted: focused.leadTimeDays,
              }))}
              xKey="month"
              series={[
                { key: 'days', label: t('trend.actual') },
                { key: 'quoted', label: t('trend.quoted'), color: 'var(--muted-foreground)' },
              ]}
              dashed={['quoted']}
              dots
              valueFormatter={(v) => `${v}d`}
            />
          ) : (
            <Skeleton className="h-80 w-full" />
          )}
        </SectionCard>
      </div>

      <SectionCard flush title={t('list.title')} description={t('list.description')}>
        <div className="border-t">
          <Table aria-label={t('list.title')}>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">{t('columns.supplier')}</TableHead>
                <TableHead className="text-right">{t('columns.lead')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('columns.trend')}</TableHead>
                <TableHead className="text-right">{t('columns.onTime')}</TableHead>
                <TableHead className="text-right">{t('columns.fill')}</TableHead>
                <TableHead className="text-right">{t('columns.skus')}</TableHead>
                <TableHead className="text-right">{t('columns.openPOs')}</TableHead>
                <TableHead className="pr-6 text-right">{t('columns.spend')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!suppliers.data &&
                Array.from({ length: 6 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8} className="px-6">
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {data.map((s) => (
                <TableRow
                  key={s.id}
                  className={cn('cursor-pointer', focused?.id === s.id && 'bg-primary/5')}
                  onClick={() => setFocus(s.id)}
                  aria-selected={focused?.id === s.id}
                >
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <InitialsAvatar name={s.name} size="sm" />
                      <div>
                        <Link
                          to={inventoryRoutes.supplier.href({ supplierId: s.id })}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium hover:underline"
                        >
                          {s.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {s.contact} · {s.country}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {t('days', { count: s.leadTimeDays })}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Sparkline
                      data={s.leadTimeTrend}
                      variant="line"
                      className="h-8 w-24"
                      label={t('columns.trend')}
                    />
                  </TableCell>
                  <TableCell
                    className={cn('text-right font-medium tabular-nums', rateClass(s.onTimeRate))}
                  >
                    {s.onTimeRate}%
                  </TableCell>
                  <TableCell className={cn('text-right tabular-nums', rateClass(s.fillRate))}>
                    {s.fillRate}%
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{s.skuCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.openPOs}</TableCell>
                  <TableCell className="pr-6 text-right font-medium tabular-nums">
                    {usdCompact(s.spendYtd)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </Page>
  );
}
