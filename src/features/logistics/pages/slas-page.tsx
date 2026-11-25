import { BadgeEuro, Handshake, ShieldAlert, Timer, Users } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useEnumParam } from '@/core/router/search-params';
import { LineChart } from '@/shared/components/charts/line-chart';
import { MeterList } from '@/shared/components/dashboard/meter-list';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { EmptyState } from '@/shared/components/display/empty-state';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';

import { slasQuery, useSlas } from '../api/partners-api';
import { BreachesCard } from '../components/breaches-card';
import { QueryBoundary } from '../components/query-state';
import { SlaCustomerTable } from '../components/sla-customer-table';
import { DashboardSkeleton, StatGrid } from '../components/stat-grid';
import { fmtCurrency, fmtPct, fmtShortDate } from '../lib/format';
import { sum, weightedMean } from '../lib/math';
import { ROOT_CAUSES, SLA_HEALTH, slaHealth, type SlaCustomer, type Slas } from '../model/slas';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(slasQuery());
    return null;
  };

const HEALTH_FILTERS = ['all', ...SLA_HEALTH] as const;
type HealthFilter = (typeof HEALTH_FILTERS)[number];

function Kpis({ slas }: { slas: Slas }) {
  const { t, i18n } = useTranslation('logistics');
  const { customers, breaches } = slas;
  const meeting = customers.filter((c) => slaHealth(c) !== 'breached').length;
  const byShipments = (value: (c: SlaCustomer) => number) =>
    weightedMean(customers, value, (c) => c.shipments);
  const credited = breaches.filter((b) => b.credit !== null);
  return (
    <StatGrid>
      <StatCard
        label={t('slas.kpi.meeting')}
        value={`${meeting} / ${customers.length}`}
        icon={Handshake}
        color="var(--success)"
        hint={t('slas.kpi.meetingHint')}
      />
      <StatCard
        label={t('slas.kpi.onTime')}
        value={fmtPct(
          byShipments((c) => c.onTimePct),
          i18n.language,
        )}
        icon={Timer}
        hint={t('slas.kpi.target', {
          target: fmtPct(
            byShipments((c) => c.targetOnTimePct),
            i18n.language,
          ),
        })}
      />
      <StatCard
        label={t('slas.kpi.breaches')}
        value={breaches.length}
        icon={ShieldAlert}
        color="var(--destructive)"
        hint={t('slas.kpi.open', { count: breaches.length - credited.length })}
      />
      <StatCard
        label={t('slas.kpi.credits')}
        value={fmtCurrency(sum(credited.map((b) => b.credit!)), i18n.language)}
        icon={BadgeEuro}
        color="var(--warning)"
        hint={t('slas.kpi.creditNotes', { count: credited.length })}
      />
    </StatGrid>
  );
}

function TrendCard({ customer }: { customer: SlaCustomer }) {
  const { t, i18n } = useTranslation('logistics');
  return (
    <SectionCard
      title={t('slas.trend.title', { customer: customer.name })}
      description={t('slas.trend.description')}
      className="xl:col-span-2"
    >
      <LineChart
        data={customer.trend.map((w) => ({ ...w, label: fmtShortDate(w.week) }))}
        xKey="label"
        series={[{ key: 'onTimePct', label: t('slas.columns.onTime') }]}
        curve="monotone"
        dots
        target={{ value: customer.targetOnTimePct, label: t('slas.trend.target') }}
        valueFormatter={(v) => fmtPct(v, i18n.language)}
        className="h-72"
      />
    </SectionCard>
  );
}

function RootCauseCard({ slas }: { slas: Slas }) {
  const { t } = useTranslation('logistics');
  const counts = ROOT_CAUSES.map((cause) => ({
    cause,
    count: slas.breaches.filter((b) => b.rootCause === cause).length,
  })).sort((a, b) => b.count - a.count);
  return (
    <SectionCard title={t('slas.causes.title')} description={t('slas.causes.description')}>
      <MeterList
        items={counts.map(({ cause, count }) => ({
          key: cause,
          label: t(`slas.cause.${cause}`),
          value: count,
          max: slas.breaches.length,
          display: count,
        }))}
      />
    </SectionCard>
  );
}

function SlaDashboard({ slas }: { slas: Slas }) {
  const { t } = useTranslation('logistics');
  const [health, setHealth] = useEnumParam<HealthFilter>('status', HEALTH_FILTERS, 'all');
  const [selectedId, setSelectedId] = useState(slas.customers[0]?.id);
  const selected = slas.customers.find((c) => c.id === selectedId) ?? slas.customers[0];
  const shown = slas.customers.filter((c) => health === 'all' || slaHealth(c) === health);

  return (
    <>
      <Kpis slas={slas} />
      <div className="grid gap-4 md:gap-6 xl:grid-cols-3">
        {selected && <TrendCard customer={selected} />}
        <RootCauseCard slas={slas} />
      </div>
      <SectionCard
        title={t('slas.customers')}
        description={t('slas.customersDescription')}
        action={
          <div className="scrollbar-none max-w-full overflow-x-auto">
            <SegmentedControl<HealthFilter>
              value={health}
              onChange={setHealth}
              aria-label={t('slas.filter')}
              options={HEALTH_FILTERS.map((h) => ({
                value: h,
                label: h === 'all' ? t('slas.all') : t(`slas.health.${h}`),
              }))}
            />
          </div>
        }
        flush
      >
        {shown.length ? (
          <SlaCustomerTable customers={shown} selectedId={selected?.id} onSelect={setSelectedId} />
        ) : (
          <EmptyState
            variant="plain"
            icon={Users}
            title={t('slas.emptyTitle')}
            description={t('slas.emptyDescription')}
            className="pb-8"
          />
        )}
      </SectionCard>
      <BreachesCard breaches={slas.breaches} />
    </>
  );
}

export default function SlasPage() {
  const { t } = useTranslation('logistics');
  const query = useSlas();
  return (
    <Page title={t('slas.title')} description={t('slas.description')} width="full">
      <QueryBoundary query={query} skeleton={<DashboardSkeleton />}>
        {(slas) => <SlaDashboard slas={slas} />}
      </QueryBoundary>
    </Page>
  );
}
