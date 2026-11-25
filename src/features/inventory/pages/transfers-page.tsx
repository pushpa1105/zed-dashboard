import { ArrowRight, CalendarClock, ChevronRight, Package, Plus, Truck } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { transfersQuery, useMoveTransfer, useTransfers } from '../api/inventory-api';
import { CreateTransferDialog } from '../components/create-transfer-dialog';
import { ErrorPanel } from '../components/error-panel';
import { qty, shortDate } from '../lib/format';
import { TRANSFER_STATUSES, type Transfer, type TransferStatus } from '../model/inventory';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(transfersQuery());
    return null;
  };

const NEXT: Partial<Record<TransferStatus, TransferStatus>> = {
  requested: 'picking',
  picking: 'in-transit',
  'in-transit': 'received',
};

const COLUMN_ACCENT: Record<TransferStatus, string> = {
  requested: 'var(--muted-foreground)',
  picking: 'var(--chart-4)',
  'in-transit': 'var(--chart-1)',
  received: 'var(--chart-2)',
};

function TransferCard({ transfer }: { transfer: Transfer }) {
  const { t } = useTranslation('inventory', { keyPrefix: 'transfers' });
  const move = useMoveTransfer();
  const next = NEXT[transfer.status];
  const units = transfer.lines.reduce((s, l) => s + l.quantity, 0);
  const late =
    transfer.status !== 'received' && transfer.eta < new Date().toISOString().slice(0, 10);

  return (
    <article className="space-y-3 rounded-lg border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-medium">{transfer.id}</span>
        <span
          className={cn(
            'flex items-center gap-1 text-xs',
            late ? 'font-medium text-destructive' : 'text-muted-foreground',
          )}
        >
          <CalendarClock className="size-3.5" />
          {late
            ? t('late', { date: shortDate(transfer.eta) })
            : t('eta', { date: shortDate(transfer.eta) })}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="rounded-md bg-muted px-2 py-0.5">{transfer.from}</span>
        <ArrowRight className="size-4 text-muted-foreground" />
        <span className="rounded-md bg-muted px-2 py-0.5">{transfer.to}</span>
        <span className="ml-auto flex min-w-0 items-center gap-1 text-xs font-normal text-muted-foreground">
          <Truck className="size-3.5 shrink-0" />
          <span className="truncate">{transfer.carrier}</span>
        </span>
      </div>
      <ul className="space-y-1 text-xs text-muted-foreground">
        {transfer.lines.slice(0, 2).map((line) => (
          <li key={line.sku} className="flex justify-between gap-2">
            <span className="truncate">{line.name}</span>
            <span className="tabular-nums">×{qty(line.quantity)}</span>
          </li>
        ))}
        {transfer.lines.length > 2 && <li>{t('more', { count: transfer.lines.length - 2 })}</li>}
      </ul>
      <div className="flex items-center justify-between border-t pt-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <InitialsAvatar name={transfer.requestedBy} size="xs" />
          <span className="flex items-center gap-1">
            <Package className="size-3.5" /> {t('units', { count: units })}
          </span>
        </div>
        {next && (
          <Button
            size="xs"
            variant="outline"
            disabled={move.isPending}
            onClick={() =>
              move.mutate(
                { id: transfer.id, status: next },
                {
                  onSuccess: () =>
                    notify.success(t('moved', { id: transfer.id, status: t(`status.${next}`) })),
                },
              )
            }
          >
            {t(`advance.${transfer.status as 'requested'}`)} <ChevronRight />
          </Button>
        )}
      </div>
    </article>
  );
}

/** Transfers as a status board: requested → picking → in transit → received. */
export default function TransfersPage() {
  const { t } = useTranslation('inventory', { keyPrefix: 'transfers' });
  const transfers = useTransfers();
  const [creating, setCreating] = useState(false);
  const inTransitUnits = (transfers.data ?? [])
    .filter((tr) => tr.status === 'in-transit')
    .reduce((s, tr) => s + tr.lines.reduce((a, l) => a + l.quantity, 0), 0);

  return (
    <Page
      title={t('title')}
      description={t('description', { units: qty(inTransitUnits) })}
      width="full"
      actions={
        <Button onClick={() => setCreating(true)}>
          <Plus /> {t('new')}
        </Button>
      }
    >
      {transfers.isError ? (
        <ErrorPanel onRetry={() => void transfers.refetch()} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {TRANSFER_STATUSES.map((status) => {
            const items = (transfers.data ?? []).filter((tr) => tr.status === status);
            return (
              <section key={status} className="flex min-w-0 flex-col rounded-xl bg-muted/50 p-3">
                <header className="flex items-center justify-between px-1 pb-3">
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: COLUMN_ACCENT[status] }}
                    />
                    {t(`status.${status}`)}
                  </h2>
                  <span className="rounded-full bg-card px-2 text-xs text-muted-foreground tabular-nums">
                    {items.length}
                  </span>
                </header>
                <div className="flex flex-1 flex-col gap-3">
                  {!transfers.data &&
                    Array.from({ length: 2 }, (_, i) => (
                      <Skeleton key={i} className="h-40 rounded-lg" />
                    ))}
                  {items.map((transfer) => (
                    <TransferCard key={transfer.id} transfer={transfer} />
                  ))}
                  {transfers.data && items.length === 0 && (
                    <p className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                      {t('emptyColumn')}
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
      <CreateTransferDialog open={creating} onOpenChange={setCreating} />
    </Page>
  );
}
