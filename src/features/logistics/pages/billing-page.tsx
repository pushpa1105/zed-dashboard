import { FileWarning, Gavel, ReceiptText, Route } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { LineChart } from '@/shared/components/charts/line-chart';
import { MeterList } from '@/shared/components/dashboard/meter-list';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { EmptyState } from '@/shared/components/display/empty-state';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { formatDate } from '@/shared/lib/format';
import { Skeleton } from '@/shared/ui/skeleton';

import { billingQuery, useBilling } from '../api/logistics-api';
import { InvoiceTable } from '../components/invoice-table';
import { LoadError } from '../components/query-state';
import { fmtCurrency, fmtRate } from '../lib/format';
import { pctChange, sum } from '../lib/math';
import { INVOICE_STATUSES, variance, type Billing, type InvoiceStatus } from '../model/billing';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(billingQuery());
    return null;
  };

type Scope = 'all' | 'flagged' | InvoiceStatus;

function CostPerKmCard({ billing }: { billing: Billing }) {
  const { t, i18n } = useTranslation('logistics');
  const data = useMemo(
    () => billing.costPerKm.map((m) => ({ ...m, label: formatDate(`${m.month}-01`, 'MMM') })),
    [billing.costPerKm],
  );
  return (
    <SectionCard
      title={t('billing.costPerKm.title')}
      description={t('billing.costPerKm.description')}
      className="xl:col-span-2"
    >
      <LineChart
        data={data}
        xKey="label"
        series={[
          { key: 'road', label: t('mode.road') },
          { key: 'rail', label: t('mode.rail') },
        ]}
        curve="monotone"
        dots
        target={{ value: billing.contractRate, label: t('billing.costPerKm.contract') }}
        valueFormatter={(v) => fmtRate(v, i18n.language)}
        className="h-72"
      />
    </SectionCard>
  );
}

function CarrierVarianceCard({ billing }: { billing: Billing }) {
  const { t, i18n } = useTranslation('logistics');
  const carriers = [...new Set(billing.invoices.map((i) => i.carrier))]
    .map((carrier) => {
      const invoices = billing.invoices.filter((i) => i.carrier === carrier);
      const quoted = sum(invoices.map((i) => i.quoted));
      const invoiced = sum(invoices.map((i) => i.invoiced));
      return { carrier, extra: invoiced - quoted, ...variance({ quoted, invoiced }) };
    })
    .sort((a, b) => b.pct - a.pct);
  return (
    <SectionCard
      title={t('billing.carriers.title')}
      description={t('billing.carriers.description')}
    >
      <MeterList
        items={carriers.map((c) => ({
          key: c.carrier,
          label: c.carrier,
          value: Math.max(0, c.pct),
          max: 15,
          display: `${c.pct > 0 ? '+' : ''}${c.pct.toFixed(1)}% · ${fmtCurrency(c.extra, i18n.language)}`,
          color:
            c.level === 'high'
              ? 'var(--destructive)'
              : c.level === 'review'
                ? 'var(--warning)'
                : 'var(--success)',
        }))}
      />
    </SectionCard>
  );
}

function Kpis({ billing }: { billing: Billing }) {
  const { t, i18n } = useTranslation('logistics');
  const money = (value: number) => fmtCurrency(value, i18n.language);
  const pending = billing.invoices.filter((i) => i.status === 'pending');
  const disputed = billing.invoices.filter((i) => i.status === 'disputed');
  const flagged = pending.filter((i) => variance(i).level === 'high');
  const [previous, latest] = billing.costPerKm.slice(-2).map((m) => m.road);
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
      <StatCard
        label={t('billing.kpi.pending')}
        value={money(sum(pending.map((i) => i.invoiced)))}
        icon={ReceiptText}
        hint={t('billing.kpi.invoices', { count: pending.length })}
      />
      <StatCard
        label={t('billing.kpi.overQuote')}
        value={money(sum(pending.map((i) => Math.max(0, i.invoiced - i.quoted))))}
        icon={FileWarning}
        color="var(--destructive)"
        hint={t('billing.kpi.flagged', { count: flagged.length })}
      />
      <StatCard
        label={t('billing.kpi.disputed')}
        value={money(sum(disputed.map((i) => i.invoiced - i.quoted)))}
        icon={Gavel}
        color="var(--warning)"
        hint={t('billing.kpi.invoices', { count: disputed.length })}
      />
      <StatCard
        label={t('billing.kpi.roadRate')}
        value={fmtRate(latest!, i18n.language)}
        icon={Route}
        color="var(--chart-2)"
        delta={pctChange(latest!, previous!)}
        invert
        hint={t('billing.kpi.vsLastMonth')}
      />
    </div>
  );
}

export default function BillingPage() {
  const { t } = useTranslation('logistics');
  const query = useBilling();
  const [scope, setScope] = useState<Scope>('pending');
  const billing = query.data;

  if (query.isError) {
    return (
      <Page title={t('billing.title')} description={t('billing.description')} width="full">
        <LoadError onRetry={() => void query.refetch()} />
      </Page>
    );
  }

  const invoices = (billing?.invoices ?? []).filter((i) =>
    scope === 'all' ? true : scope === 'flagged' ? variance(i).level !== 'ok' : i.status === scope,
  );

  return (
    <Page title={t('billing.title')} description={t('billing.description')} width="full">
      {billing ? (
        <>
          <Kpis billing={billing} />
          <div className="grid gap-4 md:gap-6 xl:grid-cols-3">
            <CostPerKmCard billing={billing} />
            <CarrierVarianceCard billing={billing} />
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </>
      )}

      <SectionCard
        title={t('billing.invoices')}
        description={t('billing.invoicesDescription')}
        action={
          <div className="scrollbar-none max-w-full overflow-x-auto">
            <SegmentedControl<Scope>
              value={scope}
              onChange={setScope}
              aria-label={t('billing.filter')}
              options={[
                { value: 'all', label: t('billing.all') },
                { value: 'flagged', label: t('billing.flagged') },
                ...INVOICE_STATUSES.map((s) => ({ value: s, label: t(`billing.status.${s}`) })),
              ]}
            />
          </div>
        }
        flush
      >
        {!billing ? (
          <Skeleton className="mx-6 mb-6 h-64" />
        ) : invoices.length ? (
          <InvoiceTable invoices={invoices} />
        ) : (
          <EmptyState
            variant="plain"
            icon={ReceiptText}
            title={t('billing.emptyTitle')}
            description={t('billing.emptyDescription')}
            className="pb-8"
          />
        )}
      </SectionCard>
    </Page>
  );
}
