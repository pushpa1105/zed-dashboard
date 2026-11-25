import { RotateCcw, Send } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { NumberInput } from '@/shared/components/forms/number-input';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';

import { countSheetQuery, useCountSheet, useSubmitCount } from '../api/inventory-api';
import { ErrorPanel } from '../components/error-panel';
import { qty, shortDate, signed, usd } from '../lib/format';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(countSheetQuery('RNO', 'A'));
    return null;
  };

const ZONES: Record<string, string[]> = {
  RNO: ['A', 'B', 'C'],
  DFW: ['A', 'B'],
  EWR: ['X', 'A'],
  RTM: ['A', 'B'],
};
/** Variance beyond this share of system quantity needs a second count. */
const TOLERANCE = 0.05;

/**
 * Cycle count sheet: enter counted quantities per bin; variances are computed
 * live, flagged when outside tolerance, and posted as adjustments.
 */
export default function CountsPage() {
  const { t } = useTranslation('inventory', { keyPrefix: 'counts' });
  const [warehouse, setWarehouse] = useState('RNO');
  const [zone, setZone] = useState('A');
  const sheet = useCountSheet(warehouse, zone);
  const submit = useSubmitCount();
  const [counted, setCounted] = useState<Record<string, number | null>>({});
  const key = (bin: string, sku: string) => `${bin}|${sku}`;
  const lines = useMemo(() => sheet.data?.lines ?? [], [sheet.data]);

  const rows = lines.map((line) => {
    const value = counted[key(line.bin, line.sku)] ?? null;
    const variance = value === null ? null : value - line.system;
    const outside = variance !== null && Math.abs(variance) > Math.max(1, line.system * TOLERANCE);
    return { ...line, value, variance, outside };
  });
  const done = rows.filter((r) => r.value !== null).length;
  const withVariance = rows.filter((r) => r.variance);
  const outside = rows.filter((r) => r.outside).length;
  const impact = withVariance.reduce((s, r) => s + (r.variance ?? 0) * r.unitCost, 0);

  const changeScope = (wh: string, z: string) => {
    setWarehouse(wh);
    setZone(z);
    setCounted({});
  };

  return (
    <Page
      title={t('title')}
      description={t('description')}
      width="full"
      actions={
        <div className="flex gap-2">
          <Select value={warehouse} onValueChange={(wh) => changeScope(wh, ZONES[wh]![0]!)}>
            <SelectTrigger className="w-28" aria-label={t('warehouse')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {Object.keys(ZONES).map((wh) => (
                <SelectItem key={wh} value={wh}>
                  {wh}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={zone} onValueChange={(z) => changeScope(warehouse, z)}>
            <SelectTrigger className="w-32" aria-label={t('zone')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {ZONES[warehouse]!.map((z) => (
                <SelectItem key={z} value={z}>
                  {t('zoneOption', { zone: z })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
    >
      <SectionCard>
        <StatStrip
          items={[
            {
              key: 'progress',
              label: t('kpis.counted'),
              value: `${done}/${rows.length}`,
              hint: sheet.data
                ? t('kpis.scheduled', { date: shortDate(sheet.data.scheduled) })
                : undefined,
            },
            { key: 'variances', label: t('kpis.variances'), value: withVariance.length },
            {
              key: 'outside',
              label: t('kpis.outside'),
              value: outside,
              hint: t('kpis.tolerance', { pct: TOLERANCE * 100 }),
            },
            {
              key: 'impact',
              label: t('kpis.impact'),
              value: `${impact >= 0 ? '+' : '−'}${usd(Math.abs(impact))}`,
            },
          ]}
        />
      </SectionCard>

      <SectionCard
        flush
        title={t('sheet.title', { warehouse, zone })}
        description={t('sheet.description')}
        action={
          <>
            <Button variant="ghost" size="sm" onClick={() => setCounted({})} disabled={done === 0}>
              <RotateCcw /> {t('reset')}
            </Button>
            <Button
              size="sm"
              disabled={done === 0 || submit.isPending}
              onClick={() =>
                submit.mutate(
                  {
                    warehouse,
                    lines: rows
                      .filter((r) => r.value !== null)
                      .map((r) => ({ sku: r.sku, bin: r.bin, counted: r.value! })),
                  },
                  {
                    onSuccess: ({ adjusted }) => {
                      notify.success(t('posted', { count: adjusted }));
                      setCounted({});
                    },
                  },
                )
              }
            >
              <Send /> {t('submit')}
            </Button>
          </>
        }
      >
        {sheet.isError ? (
          <ErrorPanel className="m-6" onRetry={() => void sheet.refetch()} />
        ) : !sheet.data ? (
          <div className="space-y-2 px-6 pb-6">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto border-t">
            <table
              className="w-full min-w-[720px] text-sm"
              aria-label={t('sheet.title', { warehouse, zone })}
            >
              <thead>
                <tr className="bg-muted/30 text-xs text-muted-foreground">
                  <th className="h-11 px-6 text-left font-medium">{t('columns.bin')}</th>
                  <th className="px-3 text-left font-medium">{t('columns.item')}</th>
                  <th className="px-3 text-right font-medium">{t('columns.system')}</th>
                  <th className="w-44 px-3 text-right font-medium">{t('columns.counted')}</th>
                  <th className="w-36 px-6 text-right font-medium">{t('columns.variance')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={key(row.bin, row.sku)}
                    className={cn(
                      'border-t',
                      row.outside && 'bg-destructive/5',
                      row.variance === 0 && 'bg-success/5',
                    )}
                  >
                    <td className="px-6 py-2 font-mono text-xs">{row.bin}</td>
                    <td className="px-3 py-2">
                      <p className="font-medium">{row.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{row.sku}</p>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{qty(row.system)}</td>
                    <td className="px-3 py-2">
                      <NumberInput
                        aria-label={t('columns.counted')}
                        value={row.value}
                        onChange={(v) =>
                          setCounted((prev) => ({ ...prev, [key(row.bin, row.sku)]: v }))
                        }
                        min={0}
                        placeholder="—"
                        invalid={row.outside}
                        className="ml-auto max-w-36"
                      />
                    </td>
                    <td className="px-6 py-2 text-right">
                      {row.variance === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span
                          className={cn(
                            'font-medium tabular-nums',
                            row.variance === 0 && 'text-success',
                            row.variance !== 0 && !row.outside && 'text-foreground',
                            row.outside && 'text-destructive',
                          )}
                        >
                          {row.variance === 0 ? t('match') : signed(row.variance)}
                          {row.outside && (
                            <span className="block text-xs font-normal">{t('recount')}</span>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      {t('empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </Page>
  );
}
