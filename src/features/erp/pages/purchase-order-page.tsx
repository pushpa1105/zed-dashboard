import { ArrowLeft, Check, Lock, PackageCheck } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { Link, useParams } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { Timeline } from '@/shared/components/display/timeline';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { ErrorPanel } from '../components/error-panel';
import { money, shortDate } from '../lib/money';
import {
  purchaseOrderQuery,
  usePurchaseOrder,
  usePurchaseOrderAction,
} from '../operations/api/operations-api';
import { PoStatusBadge } from '../operations/components/po-status-badge';
import { ReceivingProgress } from '../operations/components/receiving-progress';
import { poTotals, type PoAction, type PoStatus } from '../operations/model/operations';
import { erpRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(purchaseOrderQuery(params.poId!));
    return null;
  };

/** The single next step available at each stage. */
const NEXT: Partial<Record<PoStatus, { action: PoAction; icon: typeof Check }>> = {
  draft: { action: 'approve', icon: Check },
  approved: { action: 'receive', icon: PackageCheck },
  received: { action: 'close', icon: Lock },
};

/** One purchase order: line items with receiving progress, next action and history. */
export default function PurchaseOrderPage() {
  const { t } = useTranslation('erp', { keyPrefix: 'purchaseOrders' });
  const { poId = '' } = useParams();
  const order = usePurchaseOrder(poId);
  const action = usePurchaseOrderAction();
  const po = order.data;
  const totals = po && poTotals(po);
  const next = po && NEXT[po.status];

  const back = (
    <Button variant="ghost" asChild>
      <Link to={erpRoutes.purchaseOrders.href()}>
        <ArrowLeft /> {t('detail.back')}
      </Link>
    </Button>
  );

  if (order.isError) {
    return (
      <Page title={poId} width="full" actions={back}>
        <ErrorPanel onRetry={() => void order.refetch()} />
      </Page>
    );
  }

  return (
    <Page
      title={po ? t('detail.title', { id: po.id }) : poId}
      description={po?.vendor}
      width="full"
      actions={
        <>
          {back}
          {next && (
            <Button
              disabled={action.isPending}
              onClick={() =>
                action.mutate(
                  { id: poId, action: next.action },
                  { onSuccess: () => notify.success(t(`done.${next.action}`, { id: poId })) },
                )
              }
            >
              <next.icon /> {t(`actions.${next.action}`)}
            </Button>
          )}
        </>
      }
    >
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_22rem]">
        <SectionCard flush title={t('detail.lines')}>
          {!po || !totals ? (
            <Skeleton className="mx-6 mb-6 h-64" />
          ) : (
            <div className="border-t">
              <Table aria-label={t('detail.lines')}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">{t('detail.item')}</TableHead>
                    <TableHead className="text-right">{t('detail.ordered')}</TableHead>
                    <TableHead className="hidden w-44 sm:table-cell">
                      {t('columns.received')}
                    </TableHead>
                    <TableHead className="hidden text-right md:table-cell">
                      {t('detail.unitPrice')}
                    </TableHead>
                    <TableHead className="pr-6 text-right">{t('columns.total')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {po.lines.map((line, i) => (
                    <TableRow key={`${line.sku}-${i}`}>
                      <TableCell className="pl-6">
                        <p className="font-medium">{line.description}</p>
                        <p className="font-mono text-xs text-muted-foreground">{line.sku}</p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {line.quantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <ReceivingProgress
                          value={(line.received / line.quantity) * 100}
                          label={t('detail.lineReceived', { sku: line.sku })}
                        />
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums md:table-cell">
                        {money(line.unitPrice)}
                      </TableCell>
                      <TableCell className="pr-6 text-right font-medium tabular-nums">
                        {money(line.quantity * line.unitPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30 font-semibold hover:bg-muted/30">
                    <TableCell className="pl-6" colSpan={4}>
                      {t('detail.orderTotal')}
                    </TableCell>
                    <TableCell className="pr-6 text-right tabular-nums">
                      {money(totals.total)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </SectionCard>

        <div className="space-y-6 xl:sticky xl:top-24">
          <SectionCard title={t('detail.summary')}>
            {!po || !totals ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-2xl font-semibold tracking-tight tabular-nums">
                    {money(totals.total)}
                  </p>
                  <PoStatusBadge status={po.status} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">{t('detail.receiving')}</p>
                  <ReceivingProgress value={totals.receivedPct} label={t('detail.receiving')} />
                </div>
                <dl className="grid grid-cols-2 gap-4 border-t pt-4 text-sm">
                  {(
                    [
                      ['buyer', po.buyer],
                      ['created', shortDate(po.created)],
                      ['expected', shortDate(po.expected)],
                      ['vendor', po.vendor],
                    ] as const
                  ).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-xs text-muted-foreground">{t(`detail.fields.${key}`)}</dt>
                      <dd className="mt-1 font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </SectionCard>
          <SectionCard title={t('detail.activity')}>
            {po ? (
              <Timeline
                items={[...po.events].reverse().map((event, i) => ({
                  key: `${event.at}-${i}`,
                  title: event.label,
                  time: shortDate(event.at),
                }))}
              />
            ) : (
              <Skeleton className="h-40 w-full" />
            )}
          </SectionCard>
        </div>
      </div>
    </Page>
  );
}
