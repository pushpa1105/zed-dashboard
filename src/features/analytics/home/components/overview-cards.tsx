import { MoreHorizontal } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { AreaChart } from '@/shared/components/charts/area-chart';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { Heatmap } from '@/shared/components/charts/heatmap';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import type { AnalyticsOrderStatus, AnalyticsOverview } from '../model/overview';

import { Panel } from './panel';

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function IncomeCard({ income }: { income: AnalyticsOverview['income'] }) {
  const { t } = useTranslation('analytics', { keyPrefix: 'home' });
  return (
    <Panel title={t('income.title')} bodyClassName="p-5">
      <p className="text-sm text-muted-foreground">{t('income.subtitle')}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{usd.format(income.total)}</p>
      <BarChart
        data={income.days}
        xKey="day"
        series={[{ key: 'value', label: t('income.value'), color: 'var(--chart-2)' }]}
        hideGrid
        hideYAxis
        barSize={32}
        radius={4}
        className="mt-6 h-72"
      />
    </Panel>
  );
}

const DOT: Record<AnalyticsOrderStatus, string> = {
  approved: 'bg-success',
  pending: 'bg-warning',
  rejected: 'bg-destructive',
};

export function OrdersCard({ orders }: { orders: AnalyticsOverview['orders'] }) {
  const { t } = useTranslation('analytics', { keyPrefix: 'home' });
  return (
    <Panel
      title={t('orders.title')}
      action={
        <Button variant="ghost" size="icon-sm" aria-label={t('actions.more')}>
          <MoreHorizontal />
        </Button>
      }
      bodyClassName="overflow-hidden"
    >
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5 text-xs tracking-wide uppercase">
              {t('orders.tracking')}
            </TableHead>
            <TableHead className="text-xs tracking-wide uppercase">{t('orders.product')}</TableHead>
            <TableHead className="hidden text-right text-xs tracking-wide uppercase sm:table-cell">
              {t('orders.quantity')}
            </TableHead>
            <TableHead className="text-xs tracking-wide uppercase">{t('orders.status')}</TableHead>
            <TableHead className="pr-5 text-right text-xs tracking-wide uppercase">
              {t('orders.amount')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="pl-5 font-mono text-xs text-muted-foreground">
                {order.id}
              </TableCell>
              <TableCell>{order.product}</TableCell>
              <TableCell className="hidden text-right tabular-nums sm:table-cell">
                {order.quantity}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-2">
                  <span className={cn('size-2 rounded-full', DOT[order.status])} />
                  {t(`status.${order.status}`)}
                </span>
              </TableCell>
              <TableCell className="pr-5 text-right tabular-nums">
                {usd.format(order.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  );
}

export function ReportCard({
  report,
  trend,
}: {
  report: AnalyticsOverview['report'];
  trend: AnalyticsOverview['reportTrend'];
}) {
  const { t } = useTranslation('analytics', { keyPrefix: 'home' });
  return (
    <Panel
      title={t('report.title')}
      action={
        <Button variant="ghost" size="icon-sm" aria-label={t('actions.more')}>
          <MoreHorizontal />
        </Button>
      }
    >
      <ul className="divide-y">
        {report.map((row) => (
          <li key={row.key} className="flex items-center justify-between gap-3 px-5 py-4 text-sm">
            <span>{row.label}</span>
            <span
              className={cn(
                'font-semibold tabular-nums',
                row.tone === 'good' && 'text-success',
                row.tone === 'bad' && 'text-destructive',
              )}
            >
              {row.value}
            </span>
          </li>
        ))}
      </ul>
      <div className="border-t px-3 pt-3 pb-2">
        <AreaChart
          data={trend}
          xKey="month"
          series={[{ key: 'value', label: t('report.trend'), color: 'var(--chart-3)' }]}
          hideGrid
          hideYAxis
          className="h-36"
        />
      </div>
    </Panel>
  );
}

export function TrafficCard({ heatmap }: { heatmap: AnalyticsOverview['heatmap'] }) {
  const { t } = useTranslation('analytics', { keyPrefix: 'home' });
  return (
    <Panel title={t('traffic.title')} bodyClassName="p-5">
      <p className="mb-4 text-xs text-muted-foreground">{t('traffic.description')}</p>
      <Heatmap
        rows={heatmap.rows}
        columns={heatmap.columns}
        values={heatmap.values}
        color="var(--chart-4)"
        valueFormatter={(v) => t('traffic.sessions', { value: v.toLocaleString('en-US') })}
      />
    </Panel>
  );
}

export function SalesReportCard({ sales }: { sales: AnalyticsOverview['salesReport'] }) {
  const { t } = useTranslation('analytics', { keyPrefix: 'home' });
  return (
    <Panel title={t('sales.title')} bodyClassName="p-5">
      <p className="text-sm text-muted-foreground">{t('sales.subtitle')}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{usd.format(sales.total)}</p>
      <BarChart
        data={sales.weeks}
        xKey="day"
        barSize={12}
        series={[
          { key: 'income', label: t('sales.income'), color: 'var(--chart-3)' },
          { key: 'costs', label: t('sales.costs'), color: 'var(--chart-4)' },
        ]}
        hideYAxis
        className="mt-4 h-64"
      />
    </Panel>
  );
}
