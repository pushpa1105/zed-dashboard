import type { ReactNode } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { DonutChart } from '@/shared/components/charts/donut-chart';
import { LineChart } from '@/shared/components/charts/line-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { TrendBadge } from '@/shared/components/dashboard/trend-badge';

import type { EcommerceOverview } from '../model/overview';

const compactUsd = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(v);

export function OrderRateCard({
  data,
  action,
}: {
  data: EcommerceOverview['orderRate'];
  action?: ReactNode;
}) {
  const { t } = useTranslation('ecommerce', { keyPrefix: 'overview' });
  return (
    <SectionCard
      title={t('orderRate.title')}
      description={t('orderRate.description')}
      action={action}
    >
      <LineChart
        data={data}
        xKey="month"
        dots
        dashed={['lastYear']}
        series={[
          { key: 'thisYear', label: t('orderRate.thisYear'), color: 'var(--chart-1)' },
          { key: 'lastYear', label: t('orderRate.lastYear'), color: 'var(--chart-4)' },
        ]}
        className="h-72"
      />
    </SectionCard>
  );
}

export function CarryingCard({ carrying }: { carrying: EcommerceOverview['carrying'] }) {
  const { t } = useTranslation('ecommerce', { keyPrefix: 'overview' });
  return (
    <SectionCard title={t('carrying.title')} description={t('carrying.description')}>
      <p className="text-3xl font-semibold tracking-tight tabular-nums">
        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
          carrying.total,
        )}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <TrendBadge delta={carrying.delta} invert /> {t('carrying.hint')}
      </p>
      <BarChart
        data={carrying.bars}
        xKey="month"
        series={[{ key: 'value', label: t('carrying.value'), color: 'var(--chart-1)' }]}
        highlight="last"
        hideGrid
        hideYAxis
        barSize={22}
        radius={6}
        valueFormatter={compactUsd}
        className="mt-4 h-44"
      />
    </SectionCard>
  );
}

export function PerformanceCard({ data }: { data: EcommerceOverview['performance'] }) {
  const { t } = useTranslation('ecommerce', { keyPrefix: 'overview' });
  return (
    <SectionCard title={t('performance.title')} description={t('performance.description')}>
      <BarChart
        data={data}
        xKey="day"
        barSize={14}
        series={[
          { key: 'target', label: t('performance.target'), color: 'var(--chart-4)' },
          { key: 'paid', label: t('performance.paid'), color: 'var(--chart-2)' },
          { key: 'pending', label: t('performance.pending'), color: 'var(--chart-3)' },
        ]}
        className="h-72"
      />
    </SectionCard>
  );
}

export function ChannelsCard({ channels }: { channels: EcommerceOverview['channels'] }) {
  const { t } = useTranslation('ecommerce', { keyPrefix: 'overview' });
  return (
    <SectionCard title={t('channels.title')}>
      <DonutChart
        data={channels}
        legend="bottom"
        centerLabel={t('channels.center')}
        valueFormatter={compactUsd}
        className="gap-4"
      />
    </SectionCard>
  );
}
