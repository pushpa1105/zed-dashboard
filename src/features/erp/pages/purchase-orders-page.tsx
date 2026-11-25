import { Check, ClipboardList, PackageCheck, Truck } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { useNavigate } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { ErrorPanel } from '../components/error-panel';
import { money, moneyCompact, shortDate } from '../lib/money';
import {
  purchaseOrdersQuery,
  usePurchaseOrderAction,
  usePurchaseOrders,
} from '../operations/api/operations-api';
import { PoStatusBadge } from '../operations/components/po-status-badge';
import { ReceivingProgress } from '../operations/components/receiving-progress';
import { StatusTabs } from '../operations/components/status-tabs';
import {
  PO_STATUSES,
  poTotals,
  type PoStatus,
  type PurchaseOrder,
} from '../operations/model/operations';
import { erpRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(purchaseOrdersQuery());
    return null;
  };

type Filter = 'all' | PoStatus;

function ApproveButton({ po }: { po: PurchaseOrder }) {
  const { t } = useTranslation('erp', { keyPrefix: 'purchaseOrders' });
  const action = usePurchaseOrderAction();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={action.isPending}
      aria-label={t('approveOne', { id: po.id })}
      onClick={(e) => {
        e.stopPropagation();
        action.mutate(
          { id: po.id, action: 'approve' },
          { onSuccess: () => notify.success(t('done.approve', { id: po.id })) },
        );
      }}
    >
      <Check /> {t('actions.approve')}
    </Button>
  );
}

/** Purchase orders: commitments by stage, then the order list with inline approval. */
export default function PurchaseOrdersPage() {
  const { t } = useTranslation('erp', { keyPrefix: 'purchaseOrders' });
  const navigate = useNavigate();
  const orders = usePurchaseOrders();
  const [filter, setFilter] = useState<Filter>('all');
  const rows = (orders.data ?? []).map((po) => ({ po, ...poTotals(po) }));
  const visible = rows.filter((r) => filter === 'all' || r.po.status === filter);
  const valueOf = (status: PoStatus) =>
    rows.filter((r) => r.po.status === status).reduce((s, r) => s + r.total, 0);
  const countOf = (status: PoStatus) => rows.filter((r) => r.po.status === status).length;

  const kpis = [
    { key: 'awaiting', status: 'draft', icon: ClipboardList, color: 'var(--warning)' },
    { key: 'open', status: 'approved', icon: Truck, color: 'var(--info)' },
    { key: 'received', status: 'received', icon: PackageCheck, color: 'var(--success)' },
  ] as const;

  return (
    <Page title={t('title')} description={t('description')} width="full">
      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.key}
            variant="tile"
            icon={kpi.icon}
            color={kpi.color}
            label={t(`kpis.${kpi.key}`)}
            value={moneyCompact(valueOf(kpi.status))}
            hint={t('kpis.orders', { count: countOf(kpi.status) })}
            loading={!orders.data}
          />
        ))}
      </div>

      <SectionCard
        flush
        title={t('list.title')}
        action={
          <StatusTabs
            label={t('list.filter')}
            value={filter}
            onChange={setFilter}
            tabs={[
              { value: 'all', label: t('status.all') },
              ...PO_STATUSES.map((s) => ({ value: s, label: t(`status.${s}`), count: countOf(s) })),
            ]}
          />
        }
      >
        {orders.isError ? (
          <ErrorPanel className="m-6" onRetry={() => void orders.refetch()} />
        ) : !orders.data ? (
          <div className="space-y-2 px-6 pb-6">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : (
          <div className="border-t">
            <Table aria-label={t('list.title')}>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">{t('columns.po')}</TableHead>
                  <TableHead>{t('columns.vendor')}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t('columns.expected')}</TableHead>
                  <TableHead>{t('columns.status')}</TableHead>
                  <TableHead className="hidden w-40 md:table-cell">
                    {t('columns.received')}
                  </TableHead>
                  <TableHead className="text-right">{t('columns.total')}</TableHead>
                  <TableHead className="w-32 pr-6" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map(({ po, total, receivedPct }) => (
                  <TableRow
                    key={po.id}
                    className="cursor-pointer"
                    onClick={() => void navigate(erpRoutes.purchaseOrder.href({ poId: po.id }))}
                  >
                    <TableCell className="pl-6">
                      <p className="font-mono text-xs font-medium">{po.id}</p>
                      <p className="text-xs text-muted-foreground">{shortDate(po.created)}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{po.vendor}</p>
                      <p className="text-xs text-muted-foreground">{po.buyer}</p>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {shortDate(po.expected)}
                    </TableCell>
                    <TableCell>
                      <PoStatusBadge status={po.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <ReceivingProgress
                        value={receivedPct}
                        label={t('receivedOf', { id: po.id })}
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {money(total)}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      {po.status === 'draft' && <ApproveButton po={po} />}
                    </TableCell>
                  </TableRow>
                ))}
                {visible.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      {t('list.empty')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </Page>
  );
}
