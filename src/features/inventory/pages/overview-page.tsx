import { AlertTriangle, Boxes, PackageX, RefreshCcw, ShoppingCart, TrendingUp } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link } from '@/core/router/router';
import { AreaChart } from '@/shared/components/charts/area-chart';
import { MeterList } from '@/shared/components/dashboard/meter-list';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { overviewQuery, useOverview } from '../api/inventory-api';
import { ErrorPanel } from '../components/error-panel';
import { StockStatusBadge } from '../components/stock-status-badge';
import { qty, qtyCompact, usd, usdCompact } from '../lib/format';
import { inventoryRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(overviewQuery());
    return null;
  };

/** Inventory health at a glance: value, flow, capacity, what is running out and what to reorder. */
export default function InventoryOverviewPage() {
  const { t } = useTranslation('inventory', { keyPrefix: 'overview' });
  const overview = useOverview();
  const data = overview.data;

  if (overview.isError) {
    return (
      <Page title={t('title')} width="full">
        <ErrorPanel onRetry={() => void overview.refetch()} />
      </Page>
    );
  }

  const valueDelta = data
    ? ((data.valueTrend.at(-1)! - data.valueTrend.at(-5)!) / data.valueTrend.at(-5)!) * 100
    : 0;

  return (
    <Page
      title={t('title')}
      description={t('description')}
      width="full"
      actions={
        <Button
          variant="outline"
          onClick={() => void overview.refetch()}
          disabled={overview.isFetching}
        >
          <RefreshCcw className={cn(overview.isFetching && 'animate-spin')} /> {t('refresh')}
        </Button>
      }
    >
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          variant="accent"
          icon={Boxes}
          label={t('kpis.value')}
          value={data ? usd(data.stockValue) : '—'}
          delta={valueDelta}
          hint={t('kpis.vsMonth')}
          sparkline={data?.valueTrend}
          loading={!data}
        />
        <StatCard
          icon={TrendingUp}
          color="var(--chart-2)"
          label={t('kpis.units')}
          value={data ? qty(data.units) : '—'}
          hint={data ? t('kpis.skus', { count: data.skuCount }) : undefined}
          loading={!data}
        />
        <StatCard
          icon={AlertTriangle}
          color="var(--warning)"
          label={t('kpis.low')}
          value={data?.lowCount ?? '—'}
          hint={t('kpis.lowHint')}
          loading={!data}
        />
        <StatCard
          icon={PackageX}
          color="var(--destructive)"
          label={t('kpis.out')}
          value={data?.outCount ?? '—'}
          hint={data ? t('kpis.turns', { turns: data.turns }) : undefined}
          loading={!data}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title={t('flow.title')}
          description={t('flow.description')}
        >
          {data ? (
            <AreaChart
              className="h-72"
              data={data.flow}
              xKey="week"
              series={[
                { key: 'inbound', label: t('flow.inbound'), color: 'var(--chart-2)' },
                { key: 'outbound', label: t('flow.outbound'), color: 'var(--chart-1)' },
              ]}
              valueFormatter={qtyCompact}
            />
          ) : (
            <Skeleton className="h-72 w-full" />
          )}
        </SectionCard>
        <SectionCard
          title={t('capacity.title')}
          description={t('capacity.description')}
          footer={
            <Link
              to={inventoryRoutes.warehouses.href()}
              className="font-medium text-primary hover:underline"
            >
              {t('capacity.link')}
            </Link>
          }
        >
          {data ? (
            <MeterList
              items={data.warehouses.map((w) => {
                const pct = Math.round((w.used / w.capacity) * 100);
                return {
                  key: w.code,
                  label: (
                    <span>
                      <span className="font-medium">{w.code}</span>{' '}
                      <span className="text-muted-foreground">{w.name}</span>
                    </span>
                  ),
                  value: w.used,
                  max: w.capacity,
                  display: t('capacity.pallets', {
                    used: qty(w.used),
                    capacity: qty(w.capacity),
                    pct,
                  }),
                  color:
                    pct > 90
                      ? 'var(--destructive)'
                      : pct > 75
                        ? 'var(--warning)'
                        : 'var(--chart-1)',
                };
              })}
            />
          ) : (
            <Skeleton className="h-64 w-full" />
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <SectionCard
          flush
          title={t('reorder.title')}
          description={t('reorder.description')}
          footer={
            <Link
              to={inventoryRoutes.reorder.href()}
              className="font-medium text-primary hover:underline"
            >
              {t('reorder.link')}
            </Link>
          }
        >
          <div className="overflow-x-auto border-t">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-muted/30 text-xs text-muted-foreground">
                  <th className="h-11 px-6 text-left font-medium">{t('reorder.item')}</th>
                  <th className="px-3 text-right font-medium">{t('reorder.available')}</th>
                  <th className="px-3 text-right font-medium">{t('reorder.quantity')}</th>
                  <th className="px-3 text-left font-medium">{t('reorder.supplier')}</th>
                  <th className="px-3 text-right font-medium">{t('reorder.cost')}</th>
                  <th className="w-28 pr-6" />
                </tr>
              </thead>
              <tbody>
                {!data &&
                  Array.from({ length: 5 }, (_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-6 py-2">
                        <Skeleton className="h-10 w-full" />
                      </td>
                    </tr>
                  ))}
                {data?.suggestions.map((s) => (
                  <tr key={s.sku} className="border-t">
                    <td className="px-6 py-3">
                      <Link
                        to={inventoryRoutes.item.href({ sku: s.sku })}
                        className="font-medium hover:underline"
                      >
                        {s.name}
                      </Link>
                      <p className="font-mono text-xs text-muted-foreground">{s.sku}</p>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <span className={cn(s.available <= 0 && 'font-medium text-destructive')}>
                        {qty(s.available)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {' '}
                        / {qty(s.reorderPoint)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-medium tabular-nums">
                      {qty(s.quantity)}
                    </td>
                    <td className="px-3 py-3">
                      <p className="max-w-44 truncate">{s.supplier}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('reorder.lead', { count: s.leadTimeDays })}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{usd(s.cost)}</td>
                    <td className="py-3 pr-6 text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link
                          to={inventoryRoutes.purchaseOrders.href({
                            new: 1,
                            supplier: s.supplierId,
                          })}
                        >
                          <ShoppingCart /> {t('reorder.create')}
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title={t('alerts.title')}
          description={t('alerts.description')}
          footer={
            <Link
              to={inventoryRoutes.items.href({ status: 'low' })}
              className="font-medium text-primary hover:underline"
            >
              {t('alerts.link')}
            </Link>
          }
        >
          {!data ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <ul className="-my-2 divide-y">
              {data.alerts.map((item) => {
                const pct = item.reorderPoint
                  ? Math.max(0, Math.min(100, (item.available / item.reorderPoint) * 100))
                  : 0;
                return (
                  <li key={item.sku} className="flex items-center gap-4 py-3">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          to={inventoryRoutes.item.href({ sku: item.sku })}
                          className="truncate text-sm font-medium hover:underline"
                        >
                          {item.name}
                        </Link>
                        <StockStatusBadge status={item.status} />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              item.status === 'out' ? 'bg-destructive' : 'bg-warning',
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-24 text-right text-xs text-muted-foreground tabular-nums">
                          {t('alerts.left', {
                            available: qty(Math.max(0, item.available)),
                            point: qty(item.reorderPoint),
                          })}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      {data && (
        <p className="text-xs text-muted-foreground">
          {t('footnote', { value: usdCompact(data.stockValue) })}
        </p>
      )}
    </Page>
  );
}
