import { Building, Grid3x3, Layers, MapPin, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useSearchParams } from '@/core/router/router';
import { ProgressRing } from '@/shared/components/charts/progress-ring';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { TreeView, type TreeNode } from '@/shared/components/display/tree-view';
import { cn } from '@/shared/lib/cn';
import { Skeleton } from '@/shared/ui/skeleton';

import { useWarehouses, warehousesQuery } from '../api/inventory-api';
import { BinCell, FillLegend } from '../components/bin-cell';
import { ErrorPanel } from '../components/error-panel';
import { fillColor } from '../lib/fill';
import { qty, usdCompact } from '../lib/format';
import type { Warehouse } from '../model/inventory';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(warehousesQuery());
    return null;
  };

const avg = (values: number[]) =>
  values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : 0;

function useLayoutTree(warehouse: Warehouse | undefined) {
  const { t } = useTranslation('inventory', { keyPrefix: 'warehouses' });
  return useMemo<TreeNode[]>(() => {
    if (!warehouse) return [];
    return warehouse.zones.map((zone) => ({
      id: `zone:${zone.code}`,
      label: t('zone', { code: zone.code, name: zone.name }),
      icon: Layers,
      meta: `${avg(zone.aisles.flatMap((a) => a.bins.map((b) => b.occupancy)))}%`,
      children: zone.aisles.map((aisle) => ({
        id: `aisle:${aisle.code}`,
        label: t('aisle', { code: aisle.code }),
        icon: Grid3x3,
        meta: `${avg(aisle.bins.map((b) => b.occupancy))}%`,
        children: aisle.bins.map((bin) => ({
          id: `bin:${bin.code}`,
          label: bin.code,
          meta: `${bin.occupancy}%`,
        })),
      })),
    }));
  }, [warehouse, t]);
}

/** Network view: capacity per site, then the selected site's zones, aisles and bins. */
export default function WarehousesPage() {
  const { t } = useTranslation('inventory', { keyPrefix: 'warehouses' });
  const warehouses = useWarehouses();
  const [params, setParams] = useSearchParams();
  const selectedCode = params.get('wh') ?? 'RNO';
  const selected = warehouses.data?.find((w) => w.code === selectedCode) ?? warehouses.data?.[0];
  const tree = useLayoutTree(selected);
  const [focus, setFocus] = useState<string | null>(null);

  const focusedZone =
    selected?.zones.find((z) => focus === `zone:${z.code}`) ??
    selected?.zones.find((z) =>
      z.aisles.some(
        (a) => focus === `aisle:${a.code}` || a.bins.some((b) => focus === `bin:${b.code}`),
      ),
    ) ??
    selected?.zones[0];

  if (warehouses.isError) {
    return (
      <Page title={t('title')} width="full">
        <ErrorPanel onRetry={() => void warehouses.refetch()} />
      </Page>
    );
  }

  return (
    <Page title={t('title')} description={t('description')} width="full">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {!warehouses.data &&
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        {warehouses.data?.map((w) => {
          const pct = Math.round((w.used / w.capacity) * 100);
          const active = w.code === selected?.code;
          return (
            <button
              key={w.code}
              type="button"
              onClick={() => {
                setFocus(null);
                setParams({ wh: w.code }, { replace: true });
              }}
              aria-pressed={active}
              className={cn(
                'flex flex-col gap-4 rounded-xl border bg-card p-5 text-left shadow-xs transition-colors hover:border-primary/40',
                active && 'border-primary ring-2 ring-primary/20',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold">
                    <Building className="size-4 text-muted-foreground" />
                    {w.code}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{w.name}</p>
                </div>
                <ProgressRing value={pct} size={52} color={fillColor(pct)} />
              </div>
              <dl className="grid grid-cols-3 gap-2 border-t pt-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">{t('pallets')}</dt>
                  <dd className="font-medium tabular-nums">
                    {qty(w.used)}/{qty(w.capacity)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('skus')}</dt>
                  <dd className="font-medium tabular-nums">{w.skuCount}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('value')}</dt>
                  <dd className="font-medium tabular-nums">{usdCompact(w.value)}</dd>
                </div>
              </dl>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" /> {w.city}
                </span>
                <span className="flex items-center gap-1 truncate">
                  <UserRound className="size-3.5" /> {w.manager}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[20rem_1fr]">
        <SectionCard
          title={t('layout.title', { code: selected?.code ?? '' })}
          description={t('layout.description')}
        >
          {selected ? (
            <TreeView
              key={selected.code}
              nodes={tree}
              selectedId={focus}
              onSelect={(node) => setFocus(node.id)}
              defaultExpanded={[`zone:${selected.zones[0]?.code}`]}
              className="max-h-[32rem] overflow-y-auto"
            />
          ) : (
            <Skeleton className="h-80 w-full" />
          )}
        </SectionCard>

        <SectionCard
          title={
            focusedZone
              ? t('zone', { code: focusedZone.code, name: focusedZone.name })
              : t('layout.zone')
          }
          description={t('bins.description')}
          action={<FillLegend className="hidden sm:flex" />}
        >
          {focusedZone ? (
            <div className="space-y-2 overflow-x-auto">
              {focusedZone.aisles.map((aisle) => (
                <div key={aisle.code} className="flex items-center gap-3">
                  <span className="w-12 shrink-0 font-mono text-xs text-muted-foreground">
                    {aisle.code}
                  </span>
                  <div className="flex gap-1">
                    {aisle.bins.map((bin) => (
                      <BinCell
                        key={bin.code}
                        code={bin.code}
                        fill={bin.occupancy}
                        selected={focus === `bin:${bin.code}` || focus === `aisle:${aisle.code}`}
                        onSelect={() => setFocus(`bin:${bin.code}`)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Skeleton className="h-80 w-full" />
          )}
        </SectionCard>
      </div>
    </Page>
  );
}
