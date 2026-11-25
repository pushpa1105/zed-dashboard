import type { ReactNode } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { AreaChart } from '@/shared/components/charts/area-chart';
import { MeterList } from '@/shared/components/dashboard/meter-list';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { Skeleton } from '@/shared/ui/skeleton';

import { useCountry } from '../api/insights-api';
import { useCountryName } from '../hooks/use-country-name';
import { compact, integer, percent, shortDate } from '../lib/format';
import type { Range } from '../model/analytics';

import { QueryError } from './query-error';

function Breakdown({
  title,
  items,
}: {
  title: string;
  items: { key: string; label: ReactNode; sessions: number }[];
}) {
  const total = items.reduce((sum, i) => sum + i.sessions, 0);
  return (
    <section className="space-y-3">
      <h3 className="font-medium">{title}</h3>
      <MeterList
        items={items.map((i) => ({
          key: i.key,
          label: i.label,
          value: i.sessions,
          max: total,
          display: `${integer(i.sessions)} · ${percent((i.sessions / total) * 100, 0)}`,
        }))}
      />
    </section>
  );
}

/** Side panel with the daily sessions, channels and devices of one country. */
export function CountrySheet({
  code,
  range,
  onClose,
}: {
  code: string | null;
  range: Range;
  onClose: () => void;
}) {
  const { t } = useTranslation('analytics');
  const countryName = useCountryName();
  const query = useCountry(code, range);
  const data = query.data;

  return (
    <Sheet open={!!code} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{code && countryName(code)}</SheetTitle>
          <SheetDescription>
            {data &&
              t('geography.sheet.description', { region: t(`geography.regions.${data.region}`) })}
          </SheetDescription>
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
                    key: 'sessions',
                    label: t('geography.table.sessions'),
                    value: compact(data.sessions),
                    delta: data.delta,
                  },
                  { key: 'users', label: t('geography.table.users'), value: compact(data.users) },
                  {
                    key: 'conversion',
                    label: t('geography.table.conversion'),
                    value: percent(data.conversionRate, 2),
                  },
                ]}
              />
              <section className="space-y-2">
                <h3 className="font-medium">{t('geography.sheet.daily')}</h3>
                <AreaChart
                  data={data.daily}
                  xKey="date"
                  xFormatter={shortDate}
                  className="h-48"
                  series={[{ key: 'sessions', label: t('geography.table.sessions') }]}
                />
              </section>
              <Breakdown
                title={t('geography.sheet.channels')}
                items={data.channels.map((c) => ({
                  ...c,
                  label: t(`geography.channels.${c.key}`),
                }))}
              />
              <Breakdown
                title={t('geography.sheet.devices')}
                items={data.devices.map((d) => ({ ...d, label: t(`realtime.devices.${d.key}`) }))}
              />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
