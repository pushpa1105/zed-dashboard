import { AlertTriangle, Gauge, Grid3x3, PackageOpen } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useSearchParams } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { cn } from '@/shared/lib/cn';
import { Skeleton } from '@/shared/ui/skeleton';

import { binsQuery, useBins } from '../api/stock-api';
import { BinCell, FillLegend } from '../components/bin-cell';
import { BinSheet } from '../components/bin-sheet';
import { ErrorPanel } from '../components/error-panel';
import { qty } from '../lib/format';
import { oneOf } from '../lib/params';
import { WAREHOUSE_CODES } from '../model/inventory';
import type { Bin, BinLayout } from '../model/stock';

const warehouseOf = (params: URLSearchParams) =>
  oneOf(WAREHOUSE_CODES, params.get('warehouse'), 'RNO');

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    await queryClient.prefetchQuery(binsQuery(warehouseOf(new URL(request.url).searchParams)));
    return null;
  };

const RACK_SIZE = 4;
const TIGHT = 80;

const racksOf = (bins: Bin[]) =>
  Array.from({ length: Math.ceil(bins.length / RACK_SIZE) }, (_, i) =>
    bins.slice(i * RACK_SIZE, (i + 1) * RACK_SIZE),
  );
const avgFill = (bins: Bin[]) =>
  bins.length ? Math.round(bins.reduce((s, b) => s + b.fill, 0) / bins.length) : 0;

function ZoneMap({
  zone,
  selected,
  onSelect,
}: {
  zone: BinLayout['zones'][number];
  selected: string | null;
  onSelect: (code: string) => void;
}) {
  const { t } = useTranslation('inventory');
  const bins = zone.aisles.flatMap((a) => a.bins);

  return (
    <SectionCard
      title={t('warehouses.zone', { code: zone.code, name: zone.name })}
      description={t('bins.zoneSummary', { count: bins.length, pct: avgFill(bins) })}
    >
      <div className="space-y-2 overflow-x-auto pb-1">
        {zone.aisles.map((aisle) => (
          <div key={aisle.code} className="flex items-center gap-3">
            <span className="w-12 shrink-0 font-mono text-xs text-muted-foreground">
              {aisle.code}
            </span>
            {racksOf(aisle.bins).map((rack) => (
              <div key={rack[0]!.code} className="flex gap-1 rounded-lg border bg-muted/30 p-1">
                {rack.map((bin) => (
                  <BinCell
                    key={bin.code}
                    code={bin.code}
                    fill={bin.fill}
                    selected={bin.code === selected}
                    onSelect={() => onSelect(bin.code)}
                  />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/** Rack map of one warehouse, bins shaded by fill; a bin opens its contents and a move form. */
export default function BinsPage() {
  const { t } = useTranslation('inventory', { keyPrefix: 'bins' });
  const [params, setParams] = useSearchParams();
  const warehouse = warehouseOf(params);
  const layout = useBins(warehouse);
  const [selected, setSelected] = useState<string | null>(null);
  const bins = layout.data?.zones.flatMap((z) => z.aisles.flatMap((a) => a.bins)) ?? [];

  const kpis = [
    { key: 'bins', icon: Grid3x3, value: qty(bins.length) },
    { key: 'fill', icon: Gauge, color: 'var(--chart-2)', value: `${avgFill(bins)}%` },
    {
      key: 'tight',
      icon: AlertTriangle,
      color: 'var(--warning)',
      value: bins.filter((b) => b.fill >= TIGHT).length,
    },
    {
      key: 'empty',
      icon: PackageOpen,
      color: 'var(--muted-foreground)',
      value: bins.filter((b) => !b.skus).length,
    },
  ] as const;

  return (
    <Page
      title={t('title')}
      description={t('description')}
      width="full"
      actions={
        <SegmentedControl
          aria-label={t('warehouse')}
          size="sm"
          value={warehouse}
          onChange={(code) => {
            setSelected(null);
            setParams({ warehouse: code }, { replace: true });
          }}
          options={WAREHOUSE_CODES.map((code) => ({ value: code, label: code }))}
        />
      }
    >
      {layout.isError ? (
        <ErrorPanel onRetry={() => void layout.refetch()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map(({ key, ...kpi }) => (
              <StatCard key={key} label={t(`kpis.${key}`)} loading={!layout.data} {...kpi} />
            ))}
          </div>
          <FillLegend className="flex flex-wrap" />
          <div
            className={cn(
              'grid items-start gap-6 2xl:grid-cols-2',
              layout.isPlaceholderData && 'opacity-60',
            )}
          >
            {layout.data
              ? layout.data.zones.map((zone) => (
                  <ZoneMap key={zone.code} zone={zone} selected={selected} onSelect={setSelected} />
                ))
              : Array.from({ length: 2 }, (_, i) => (
                  <Skeleton key={i} className="h-72 rounded-xl" />
                ))}
          </div>
        </>
      )}
      <BinSheet
        warehouse={warehouse}
        code={selected}
        targets={bins.filter((b) => b.fill < TIGHT).map((b) => b.code)}
        onClose={() => setSelected(null)}
      />
    </Page>
  );
}
