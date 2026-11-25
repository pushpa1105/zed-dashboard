import { CheckCheck, ScanBarcode, Truck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { NumberInput } from '@/shared/components/forms/number-input';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Progress } from '@/shared/ui/progress';
import { Skeleton } from '@/shared/ui/skeleton';

import { receiptsQuery, useReceipts, useReceive } from '../api/inventory-api';
import { ErrorPanel } from '../components/error-panel';
import { qty, shortDate } from '../lib/format';
import type { Receipt } from '../model/inventory';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(receiptsQuery());
    return null;
  };

const STATUS_TONE = { open: 'neutral', partial: 'warning', complete: 'success' } as const;

function ReceiptWorkbench({ receipt }: { receipt: Receipt }) {
  const { t } = useTranslation('inventory', { keyPrefix: 'receiving' });
  const receive = useReceive();
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(receipt.lines.map((l) => [l.sku, l.received])),
  );
  const [scan, setScan] = useState('');
  const [flash, setFlash] = useState<string | null>(null);
  const scanRef = useRef<HTMLInputElement>(null);

  useEffect(() => scanRef.current?.focus(), []);
  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 900);
    return () => clearTimeout(id);
  }, [flash]);

  const expected = receipt.lines.reduce((s, l) => s + l.expected, 0);
  const received = receipt.lines.reduce((s, l) => s + (counts[l.sku] ?? 0), 0);
  const dirty = receipt.lines.some((l) => (counts[l.sku] ?? 0) !== l.received);

  const onScan = () => {
    const code = scan.trim().toUpperCase();
    if (!code) return;
    const line = receipt.lines.find(
      (l) => l.sku.toUpperCase() === code || l.sku.toUpperCase().endsWith(code),
    );
    if (!line) {
      notify.error(t('scan.unknown', { code }));
    } else {
      setCounts((prev) => ({ ...prev, [line.sku]: (prev[line.sku] ?? 0) + 1 }));
      setFlash(line.sku);
    }
    setScan('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">
            {receipt.po}{' '}
            <span className="font-normal text-muted-foreground">· {receipt.supplier}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {t('expectedAt', { warehouse: receipt.warehouse, date: shortDate(receipt.expected) })}
          </p>
        </div>
        <div className="w-full max-w-60 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{t('progress')}</span>
            <span className="font-medium tabular-nums">
              {qty(received)} / {qty(expected)}
            </span>
          </div>
          <Progress value={expected ? Math.min(100, (received / expected) * 100) : 0} />
        </div>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onScan();
        }}
      >
        <div className="relative flex-1">
          <ScanBarcode className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={scanRef}
            value={scan}
            onChange={(e) => setScan(e.target.value)}
            placeholder={t('scan.placeholder')}
            aria-label={t('scan.label')}
            className="pl-9 font-mono"
          />
        </div>
        <Button type="submit" variant="outline">
          {t('scan.add')}
        </Button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="bg-muted/30 text-xs text-muted-foreground">
              <th className="h-11 px-4 text-left font-medium">{t('columns.item')}</th>
              <th className="px-3 text-right font-medium">{t('columns.expected')}</th>
              <th className="w-40 px-3 text-right font-medium">{t('columns.received')}</th>
              <th className="w-28 px-4 text-right font-medium">{t('columns.state')}</th>
            </tr>
          </thead>
          <tbody>
            {receipt.lines.map((line) => {
              const value = counts[line.sku] ?? 0;
              const done = value >= line.expected;
              const over = value > line.expected;
              return (
                <tr
                  key={line.sku}
                  className={cn(
                    'border-t transition-colors',
                    flash === line.sku && 'bg-primary/10',
                    done && !over && 'bg-success/5',
                  )}
                >
                  <td className="px-4 py-2.5">
                    <p className="font-medium">{line.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{line.sku}</p>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{qty(line.expected)}</td>
                  <td className="px-3 py-2.5">
                    <NumberInput
                      aria-label={t('columns.received')}
                      value={value}
                      onChange={(v) => setCounts((prev) => ({ ...prev, [line.sku]: v ?? 0 }))}
                      min={0}
                      steppers
                      className="ml-auto max-w-36"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs">
                    {over ? (
                      <span className="font-medium text-warning-foreground dark:text-warning">
                        {t('state.over', { count: value - line.expected })}
                      </span>
                    ) : done ? (
                      <span className="font-medium text-success">{t('state.done')}</span>
                    ) : (
                      <span className="text-muted-foreground">
                        {t('state.short', { count: line.expected - value })}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          onClick={() =>
            setCounts(Object.fromEntries(receipt.lines.map((l) => [l.sku, l.expected])))
          }
        >
          <CheckCheck /> {t('fillExpected')}
        </Button>
        <Button
          disabled={!dirty || receive.isPending}
          onClick={() =>
            receive.mutate(
              {
                id: receipt.id,
                lines: receipt.lines.map((l) => ({ sku: l.sku, received: counts[l.sku] ?? 0 })),
              },
              {
                onSuccess: (r) =>
                  notify.success(t('posted', { po: r.po, status: t(`status.${r.status}`) })),
              },
            )
          }
        >
          {t('post')}
        </Button>
      </div>
    </div>
  );
}

/** Dock receiving: pick an inbound PO, scan or type quantities, post the receipt. */
export default function ReceivingPage() {
  const { t } = useTranslation('inventory', { keyPrefix: 'receiving' });
  const receipts = useReceipts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    receipts.data?.find((r) => r.id === selectedId) ??
    receipts.data?.find((r) => r.status !== 'complete') ??
    receipts.data?.[0];

  return (
    <Page title={t('title')} description={t('description')} width="full">
      {receipts.isError ? (
        <ErrorPanel onRetry={() => void receipts.refetch()} />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[20rem_1fr]">
          <SectionCard flush title={t('inbound')}>
            <ul className="divide-y border-t">
              {!receipts.data &&
                Array.from({ length: 5 }, (_, i) => (
                  <li key={i} className="p-4">
                    <Skeleton className="h-12 w-full" />
                  </li>
                ))}
              {receipts.data?.map((r) => {
                const active = r.id === selected?.id;
                const units = r.lines.reduce((s, l) => s + l.expected, 0);
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(r.id)}
                      aria-current={active || undefined}
                      className={cn(
                        'flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-muted/40',
                        active && 'bg-primary/5 shadow-[inset_3px_0_0_var(--primary)]',
                      )}
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Truck className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-medium">{r.po}</span>
                          <StatusBadge
                            status={r.status}
                            tone={STATUS_TONE[r.status]}
                            label={t(`status.${r.status}`)}
                            variant="dot"
                          />
                        </span>
                        <span className="mt-0.5 block truncate text-sm">{r.supplier}</span>
                        <span className="text-xs text-muted-foreground">
                          {t('summary', {
                            lines: r.lines.length,
                            units: qty(units),
                            date: shortDate(r.expected),
                          })}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </SectionCard>
          <SectionCard>
            {selected ? (
              <ReceiptWorkbench key={selected.id + selected.status} receipt={selected} />
            ) : (
              <Skeleton className="h-96 w-full" />
            )}
          </SectionCard>
        </div>
      )}
    </Page>
  );
}
