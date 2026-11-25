import { useTranslation } from '@/core/i18n/use-translation';
import { AreaChart } from '@/shared/components/charts/area-chart';
import { cn } from '@/shared/lib/cn';
import { Skeleton } from '@/shared/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';

import { useVisitors } from '../api/analytics-api';
import { GRANULARITIES, type Granularity } from '../model/overview';

import { Panel } from './panel';

/** Owns its own query: switching Month/Week refetches only this chart. */
export function VisitorsCard({
  granularity,
  onGranularityChange,
}: {
  granularity: Granularity;
  onGranularityChange: (value: Granularity) => void;
}) {
  const { t } = useTranslation('analytics', { keyPrefix: 'home' });
  const visitors = useVisitors(granularity);

  return (
    <Panel
      title={t('visitors.title')}
      action={
        <ToggleGroup
          type="single"
          size="sm"
          value={granularity}
          onValueChange={(value) => value && onGranularityChange(value as Granularity)}
          aria-label={t('visitors.granularity')}
        >
          {GRANULARITIES.map((g) => (
            <ToggleGroupItem
              key={g}
              value={g}
              className="px-3 data-[state=on]:bg-transparent data-[state=on]:text-primary data-[state=on]:ring-1 data-[state=on]:ring-primary"
            >
              {t(`visitors.${g}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      }
      bodyClassName="p-4"
    >
      {visitors.data ? (
        <div className={cn('transition-opacity', visitors.isPlaceholderData && 'opacity-50')}>
          <AreaChart
            data={visitors.data.points}
            xKey="label"
            series={[
              { key: 'pageViews', label: t('visitors.pageViews'), color: 'var(--chart-4)' },
              { key: 'sessions', label: t('visitors.sessions'), color: 'var(--chart-1)' },
            ]}
            className="h-80"
          />
        </div>
      ) : (
        <Skeleton className="h-80 w-full" />
      )}
    </Panel>
  );
}
