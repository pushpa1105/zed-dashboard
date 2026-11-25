import { useTranslation } from '@/core/i18n/use-translation';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { RadarChart } from '@/shared/components/charts/radar-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { Skeleton } from '@/shared/ui/skeleton';

import type { MarketingOverview } from '../model/marketing';

export function PostStatsCard({ stats }: { stats?: MarketingOverview['postStats'] }) {
  const { t } = useTranslation('analytics', { keyPrefix: 'campaigns' });
  const peakIndex = stats
    ? stats.reduce((best, d, i, all) => (d.posts > all[best]!.posts ? i : best), 0)
    : 0;

  return (
    <SectionCard
      title={t('postStats.title')}
      description={t('postStats.description')}
      className="lg:col-span-3"
      footer={stats && t('postStats.peak', { day: stats[peakIndex]?.day })}
    >
      {stats ? (
        <BarChart
          className="h-52"
          data={stats}
          xKey="day"
          series={[{ key: 'posts', label: t('postStats.posts') }]}
          highlight={peakIndex}
          barSize={18}
          hideYAxis
        />
      ) : (
        <Skeleton className="h-52 w-full" />
      )}
    </SectionCard>
  );
}

export function ChannelsCard({ channels }: { channels?: MarketingOverview['channels'] }) {
  const { t } = useTranslation('analytics', { keyPrefix: 'campaigns' });

  return (
    <SectionCard
      title={t('channels.title')}
      description={t('channels.description')}
      className="lg:col-span-3"
    >
      {channels ? (
        <RadarChart
          className="max-h-64"
          data={channels}
          axisKey="channel"
          series={[
            { key: 'current', label: t('channels.current'), color: 'var(--chart-1)' },
            { key: 'previous', label: t('channels.previous'), color: 'var(--chart-2)' },
          ]}
        />
      ) : (
        <Skeleton className="h-64 w-full" />
      )}
    </SectionCard>
  );
}
