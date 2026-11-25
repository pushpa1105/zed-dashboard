import { Gauge, PackageX, Timer, Truck } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useEnumParam } from '@/core/router/search-params';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { DonutChart } from '@/shared/components/charts/donut-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { EmptyState } from '@/shared/components/display/empty-state';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';

import { carriersQuery, useCarriers } from '../api/partners-api';
import { CarrierSheet } from '../components/carrier-sheet';
import { CarrierTable } from '../components/carrier-table';
import { QueryBoundary } from '../components/query-state';
import { DashboardSkeleton, StatGrid } from '../components/stat-grid';
import { fmtPct } from '../lib/format';
import { mean, sum, weightedMean } from '../lib/math';
import type { Carrier } from '../model/carriers';
import { TRANSPORT_MODES } from '../model/logistics';
import { ON_TIME_TARGET } from '../model/performance';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(carriersQuery());
    return null;
  };

const MODE_FILTERS = ['all', ...TRANSPORT_MODES] as const;
type ModeFilter = (typeof MODE_FILTERS)[number];

function Kpis({ carriers }: { carriers: Carrier[] }) {
  const { t, i18n } = useTranslation('logistics');
  const active = carriers.filter((c) => c.status === 'active');
  const byShipments = (value: (c: Carrier) => number) =>
    fmtPct(
      weightedMean(active, value, (c) => c.shipments),
      i18n.language,
    );
  return (
    <StatGrid>
      <StatCard
        label={t('carriers.kpi.active')}
        value={`${active.length} / ${carriers.length}`}
        icon={Truck}
        hint={t('carriers.kpi.shipmentsHint', { count: sum(active.map((c) => c.shipments)) })}
      />
      <StatCard
        label={t('carriers.kpi.onTime')}
        value={byShipments((c) => c.onTimePct)}
        icon={Timer}
        color="var(--success)"
        hint={t('carriers.kpi.target', { target: ON_TIME_TARGET })}
      />
      <StatCard
        label={t('carriers.kpi.damage')}
        value={byShipments((c) => c.damageRatePct)}
        icon={PackageX}
        color="var(--destructive)"
        hint={t('carriers.kpi.damageHint')}
      />
      <StatCard
        label={t('carriers.kpi.costIndex')}
        value={Math.round(mean(active.map((c) => c.costIndex)))}
        icon={Gauge}
        color="var(--chart-2)"
        hint={t('carriers.kpi.costHint')}
      />
    </StatGrid>
  );
}

function Charts({ carriers }: { carriers: Carrier[] }) {
  const { t, i18n } = useTranslation('logistics');
  const ranked = carriers
    .filter((c) => c.status === 'active')
    .sort((a, b) => b.onTimePct - a.onTimePct)
    .map((c) => ({ name: c.name, onTime: c.onTimePct }));
  const mix = TRANSPORT_MODES.map((mode) => ({
    key: mode,
    label: t(`mode.${mode}`),
    value: sum(carriers.filter((c) => c.mode === mode).map((c) => c.shipments)),
  }));
  return (
    <div className="grid gap-4 md:gap-6 xl:grid-cols-3">
      <SectionCard
        title={t('carriers.ranking.title')}
        description={t('carriers.ranking.description')}
        className="xl:col-span-2"
      >
        <BarChart
          data={ranked}
          xKey="name"
          horizontal
          series={[{ key: 'onTime', label: t('carriers.columns.onTime') }]}
          valueFormatter={(v) => fmtPct(v, i18n.language)}
          barSize={16}
          className="h-80"
        />
      </SectionCard>
      <SectionCard title={t('carriers.mix.title')} description={t('carriers.mix.description')}>
        <DonutChart
          data={mix}
          legend="bottom"
          centerLabel={t('carriers.mix.center')}
          className="h-80"
        />
      </SectionCard>
    </div>
  );
}

export default function CarriersPage() {
  const { t } = useTranslation('logistics');
  const query = useCarriers();
  const [mode, setMode] = useEnumParam<ModeFilter>('mode', MODE_FILTERS, 'all');
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <Page title={t('carriers.title')} description={t('carriers.description')} width="full">
      <QueryBoundary query={query} skeleton={<DashboardSkeleton />}>
        {(carriers) => {
          const shown = carriers.filter((c) => mode === 'all' || c.mode === mode);
          return (
            <>
              <Kpis carriers={carriers} />
              <Charts carriers={carriers} />
              <SectionCard
                title={t('carriers.table')}
                description={t('carriers.tableDescription')}
                action={
                  <div className="scrollbar-none max-w-full overflow-x-auto">
                    <SegmentedControl<ModeFilter>
                      value={mode}
                      onChange={setMode}
                      aria-label={t('carriers.filter')}
                      options={MODE_FILTERS.map((m) => ({
                        value: m,
                        label: m === 'all' ? t('carriers.all') : t(`mode.${m}`),
                      }))}
                    />
                  </div>
                }
                flush
              >
                {shown.length ? (
                  <CarrierTable carriers={shown} onOpen={setOpenId} />
                ) : (
                  <EmptyState
                    variant="plain"
                    icon={Truck}
                    title={t('carriers.emptyTitle')}
                    description={t('carriers.emptyDescription')}
                    className="pb-8"
                  />
                )}
              </SectionCard>
            </>
          );
        }}
      </QueryBoundary>
      <CarrierSheet carrierId={openId} onClose={() => setOpenId(null)} />
    </Page>
  );
}
