import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { AreaChart } from '@/shared/components/charts/area-chart';
import { MeterList } from '@/shared/components/dashboard/meter-list';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { Skeleton } from '@/shared/ui/skeleton';

import { useEvent } from '../api/analytics-api';
import { compact, integer, percent, shortDate } from '../lib/format';
import type { EventDetail, EventRow, Range } from '../model/analytics';

import { QueryError } from './query-error';

function PropertyBreakdown({ properties }: { properties: EventDetail['properties'] }) {
  const { t } = useTranslation('analytics');
  const [key, setKey] = useState(properties[0]!.key);
  const property = properties.find((p) => p.key === key) ?? properties[0]!;
  const total = property.values.reduce((sum, v) => sum + v.count, 0);

  return (
    <section className="space-y-4">
      <h3 className="font-medium">{t('events.sheet.properties')}</h3>
      <div className="scrollbar-none overflow-x-auto">
        <SegmentedControl
          size="sm"
          value={property.key}
          onChange={setKey}
          aria-label={t('events.sheet.property')}
          options={properties.map((p) => ({
            value: p.key,
            label: <span className="font-mono">{p.key}</span>,
          }))}
        />
      </div>
      <MeterList
        items={property.values.map((v) => ({
          key: v.value,
          label: v.value,
          value: v.count,
          max: total,
          display: `${integer(v.count)} · ${percent((v.count / total) * 100, 0)}`,
        }))}
      />
    </section>
  );
}

/** Side panel with the daily volume and property breakdown of one event. */
export function EventSheet({
  event,
  range,
  onClose,
}: {
  event: EventRow | null;
  range: Range;
  onClose: () => void;
}) {
  const { t } = useTranslation('analytics');
  const query = useEvent(event?.key ?? null, range);
  const data = query.data;

  return (
    <Sheet open={!!event} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{event?.label}</SheetTitle>
          <SheetDescription className="font-mono">{event?.key}</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-4 pb-6">
          {query.isError ? (
            <QueryError onRetry={() => void query.refetch()} />
          ) : !data ? (
            <>
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-48 rounded-lg" />
              <Skeleton className="h-56 rounded-lg" />
            </>
          ) : (
            <>
              <StatStrip
                items={[
                  {
                    key: 'count',
                    label: t('events.table.count'),
                    value: compact(data.count),
                    delta: data.delta,
                  },
                  { key: 'users', label: t('events.table.users'), value: compact(data.users) },
                  {
                    key: 'perUser',
                    label: t('events.table.perUser'),
                    value: (data.count / data.users).toFixed(1),
                  },
                ]}
              />
              <section className="space-y-2">
                <h3 className="font-medium">{t('events.sheet.daily')}</h3>
                <AreaChart
                  data={data.daily}
                  xKey="date"
                  xFormatter={shortDate}
                  className="h-48"
                  series={[{ key: 'count', label: t('events.table.count') }]}
                />
              </section>
              <PropertyBreakdown key={data.key} properties={data.properties} />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
