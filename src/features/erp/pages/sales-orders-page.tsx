import { BadgeCheck, FileSignature, PackageCheck, ReceiptText } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useSearchParams } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { ErrorPanel } from '../components/error-panel';
import { ListFilters } from '../components/list-filters';
import { EmptyRow, TableSkeleton } from '../components/table-states';
import { money, moneyCompact, shortDate } from '../lib/money';
import { StatusTabs } from '../operations/components/status-tabs';
import { salesOrdersQuery, useSalesOrders } from '../sales/api/sales-api';
import { OrderSheet } from '../sales/components/order-sheet';
import { OrderActionButton, OrderStatusBadge } from '../sales/components/order-status';
import { SO_STATUSES, soTotals, type SoStatus } from '../sales/model/sales';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(salesOrdersQuery());
    return null;
  };

const KPIS = [
  { status: 'quote', icon: FileSignature, color: 'var(--chart-1)' },
  { status: 'confirmed', icon: BadgeCheck, color: 'var(--info)' },
  { status: 'fulfilled', icon: PackageCheck, color: 'var(--warning)' },
  { status: 'invoiced', icon: ReceiptText, color: 'var(--success)' },
] as const;

/** Sales orders from quote to invoice, with the next step one click away. */
export default function SalesOrdersPage() {
  const { t } = useTranslation('erp', { keyPrefix: 'salesOrders' });
  const orders = useSalesOrders();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string>();
  const filter = SO_STATUSES.find((s) => s === params.get('status')) ?? 'all';

  const rows = (orders.data ?? []).map((order) => ({ order, total: soTotals(order).total }));
  const byStatus = (status: SoStatus) => rows.filter((r) => r.order.status === status);
  const query = search.trim().toLowerCase();
  const visible = rows.filter(
    ({ order }) =>
      (filter === 'all' || order.status === filter) &&
      `${order.id} ${order.customer}`.toLowerCase().includes(query),
  );

  return (
    <Page title={t('title')} description={t('description')} width="full">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((kpi) => (
          <StatCard
            key={kpi.status}
            variant="tile"
            icon={kpi.icon}
            color={kpi.color}
            label={t(`kpis.${kpi.status}`)}
            value={moneyCompact(byStatus(kpi.status).reduce((s, r) => s + r.total, 0))}
            hint={t('kpis.orders', { count: byStatus(kpi.status).length })}
            loading={!orders.data}
          />
        ))}
      </div>

      <SectionCard
        flush
        title={t('list.title')}
        action={
          <ListFilters search={search} onSearch={setSearch} label={t('list.search')}>
            <StatusTabs
              label={t('list.filter')}
              value={filter}
              onChange={(next) =>
                setParams(next === 'all' ? {} : { status: next }, { replace: true })
              }
              tabs={[
                { value: 'all', label: t('status.all') },
                ...SO_STATUSES.map((s) => ({
                  value: s,
                  label: t(`status.${s}`),
                  count: byStatus(s).length,
                })),
              ]}
            />
          </ListFilters>
        }
      >
        {orders.isError ? (
          <ErrorPanel className="m-6" onRetry={() => void orders.refetch()} />
        ) : !orders.data ? (
          <TableSkeleton />
        ) : (
          <div className="border-t">
            <Table aria-label={t('list.title')}>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">{t('columns.order')}</TableHead>
                  <TableHead>{t('columns.customer')}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t('columns.delivery')}</TableHead>
                  <TableHead>{t('columns.status')}</TableHead>
                  <TableHead className="text-right">{t('columns.total')}</TableHead>
                  <TableHead className="w-40 pr-6" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map(({ order, total }) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => setOpenId(order.id)}
                  >
                    <TableCell className="pl-6">
                      <p className="font-mono text-xs font-medium">{order.id}</p>
                      <p className="text-xs text-muted-foreground">{shortDate(order.created)}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{order.customer}</p>
                      <p className="text-xs text-muted-foreground">{order.rep}</p>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {shortDate(order.delivery)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {money(total)}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <OrderActionButton order={order} />
                    </TableCell>
                  </TableRow>
                ))}
                {visible.length === 0 && <EmptyRow colSpan={6}>{t('list.empty')}</EmptyRow>}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <OrderSheet
        order={orders.data?.find((o) => o.id === openId)}
        onClose={() => setOpenId(undefined)}
      />
    </Page>
  );
}
