import { CircleAlert, Clock3, Gauge, Wallet } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useSearchParams } from '@/core/router/router';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { ErrorPanel } from '../components/error-panel';
import { ListFilters } from '../components/list-filters';
import { EmptyRow, TableSkeleton } from '../components/table-states';
import { BUCKET_COLOR } from '../lib/aging';
import { money, moneyCompact, shortDate } from '../lib/money';
import { AGING_BUCKETS } from '../model/erp';
import { StatusTabs } from '../operations/components/status-tabs';
import { receivablesQuery, useReceivables } from '../sales/api/sales-api';
import { RemindButton } from '../sales/components/remind-button';
import { StatementSheet } from '../sales/components/statement-sheet';
import { customerAging } from '../sales/model/sales';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(receivablesQuery());
    return null;
  };

const VIEWS = ['all', 'overdue', 'critical'] as const;
type View = (typeof VIEWS)[number];

/** Receivables by customer: aging per account, collection risk and statements. */
export default function ReceivablesPage() {
  const { t } = useTranslation('erp', { keyPrefix: 'receivables' });
  const { t: tBucket } = useTranslation('erp', { keyPrefix: 'invoices.aging.buckets' });
  const receivables = useReceivables();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string>();
  const view = VIEWS.find((v) => v === params.get('view')) ?? 'all';

  const rows = (receivables.data ?? [])
    .map((customer) => ({ customer, ...customerAging(customer) }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);
  const inView: Record<View, (r: (typeof rows)[number]) => boolean> = {
    all: () => true,
    overdue: (r) => r.overdue > 0,
    critical: (r) => r.buckets['90+'] > 0,
  };
  const query = search.trim().toLowerCase();
  const visible = rows.filter(
    (r) => inView[view](r) && r.customer.name.toLowerCase().includes(query),
  );
  const sum = (pick: (r: (typeof rows)[number]) => number) => rows.reduce((s, r) => s + pick(r), 0);
  const outstanding = sum((r) => r.total);
  const overdue = sum((r) => r.overdue);

  const kpis = [
    {
      key: 'outstanding',
      icon: Wallet,
      color: 'var(--chart-1)',
      value: moneyCompact(outstanding),
      hint: t('kpis.customers', { count: rows.length }),
    },
    {
      key: 'overdue',
      icon: Clock3,
      color: 'var(--warning)',
      value: moneyCompact(overdue),
      hint: t('kpis.share', { pct: outstanding ? Math.round((overdue / outstanding) * 100) : 0 }),
    },
    {
      key: 'critical',
      icon: CircleAlert,
      color: 'var(--destructive)',
      value: moneyCompact(sum((r) => r.buckets['90+'])),
      hint: t('kpis.customers', { count: rows.filter(inView.critical).length }),
    },
    {
      key: 'overLimit',
      icon: Gauge,
      color: 'var(--info)',
      value: String(rows.filter((r) => r.total > r.customer.creditLimit).length),
      hint: t('kpis.overLimitHint'),
    },
  ] as const;

  if (receivables.isError) {
    return (
      <Page title={t('title')} width="full">
        <ErrorPanel onRetry={() => void receivables.refetch()} />
      </Page>
    );
  }

  return (
    <Page title={t('title')} description={t('description')} width="full">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.key}
            variant="tile"
            icon={kpi.icon}
            color={kpi.color}
            label={t(`kpis.${kpi.key}`)}
            value={kpi.value}
            hint={kpi.hint}
            loading={!receivables.data}
          />
        ))}
      </div>

      <SectionCard title={t('chart.title')} description={t('chart.description')}>
        {receivables.data ? (
          <BarChart
            horizontal
            mode="stacked"
            className="h-80"
            data={rows.slice(0, 8).map((r) => ({ name: r.customer.name, ...r.buckets }))}
            xKey="name"
            series={AGING_BUCKETS.map((b) => ({
              key: b,
              label: tBucket(b),
              color: BUCKET_COLOR[b],
            }))}
            valueFormatter={moneyCompact}
          />
        ) : (
          <Skeleton className="h-80 w-full" />
        )}
      </SectionCard>

      <SectionCard
        flush
        title={t('list.title')}
        action={
          <ListFilters search={search} onSearch={setSearch} label={t('list.search')}>
            <StatusTabs
              label={t('list.filter')}
              value={view}
              onChange={(next) =>
                setParams(next === 'all' ? {} : { view: next }, { replace: true })
              }
              tabs={VIEWS.map((v) => ({
                value: v,
                label: t(`views.${v}`),
                count: rows.filter(inView[v]).length,
              }))}
            />
          </ListFilters>
        }
      >
        {!receivables.data ? (
          <TableSkeleton />
        ) : (
          <div className="border-t">
            <Table aria-label={t('list.title')}>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">{t('columns.customer')}</TableHead>
                  {AGING_BUCKETS.map((b) => (
                    <TableHead key={b} className="hidden text-right lg:table-cell">
                      {tBucket(b)}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">{t('columns.balance')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('columns.reminded')}</TableHead>
                  <TableHead className="w-36 pr-6" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map(({ customer, buckets, total }) => (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer"
                    onClick={() => setOpenId(customer.id)}
                  >
                    <TableCell className="pl-6">
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.email}</p>
                    </TableCell>
                    {AGING_BUCKETS.map((b) => (
                      <TableCell
                        key={b}
                        className="hidden text-right text-muted-foreground tabular-nums lg:table-cell"
                      >
                        {buckets[b] ? moneyCompact(buckets[b]) : '—'}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-medium tabular-nums">
                      {money(total)}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {customer.lastReminder ? shortDate(customer.lastReminder) : '—'}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <RemindButton customer={customer} />
                    </TableCell>
                  </TableRow>
                ))}
                {visible.length === 0 && <EmptyRow colSpan={9}>{t('list.empty')}</EmptyRow>}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <StatementSheet
        customer={receivables.data?.find((c) => c.id === openId)}
        onClose={() => setOpenId(undefined)}
      />
    </Page>
  );
}
