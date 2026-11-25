import { differenceInCalendarDays, endOfDay, startOfDay, subDays } from 'date-fns';
import { Activity, Briefcase, MessagesSquare, Trophy } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { MeterList } from '@/shared/components/dashboard/meter-list';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { EmptyState } from '@/shared/components/display/empty-state';
import { TONES } from '@/shared/components/display/tone';
import { DateRangePicker, type DateRange } from '@/shared/components/forms/date-range-picker';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';

import { activityQuery, useActivityFeed } from '../api/activity-api';
import { ActivityTimeline } from '../components/activity-timeline';
import { FilterChips, WidgetError } from '../components/crm-parts';
import { LogActivityDialog } from '../components/log-activity-dialog';
import { shortDate } from '../lib/format';
import { ACTIVITY_TONE, ACTIVITY_TYPES, type ActivityType, type FeedItem } from '../model/activity';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(activityQuery());
    return null;
  };

const PAGE = 25;
const lastDays = (days: number): DateRange => ({
  from: subDays(startOfDay(new Date()), days - 1),
  to: startOfDay(new Date()),
});

const countBy = <K extends string>(items: FeedItem[], key: (item: FeedItem) => K) =>
  items.reduce(
    (map, item) => map.set(key(item), (map.get(key(item)) ?? 0) + 1),
    new Map<K, number>(),
  );

function ActivityStats({ items, loading }: { items: FeedItem[]; loading: boolean }) {
  const { t } = useTranslation('crm');
  const [topRep, topCount] =
    [...countBy(items, (i) => i.owner)].sort((a, b) => b[1] - a[1])[0] ?? [];
  const stats = [
    { key: 'total', icon: Activity, value: items.length },
    {
      key: 'conversations',
      icon: MessagesSquare,
      value: items.filter((i) => i.type === 'call' || i.type === 'meeting').length,
    },
    { key: 'deals', icon: Briefcase, value: new Set(items.map((i) => i.dealId)).size },
    {
      key: 'topRep',
      icon: Trophy,
      value: topRep ?? '—',
      hint: topRep && t('activity.stats.activities', { count: topCount }),
    },
  ] as const;
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
      {stats.map(({ key, ...stat }, i) => (
        <StatCard
          key={key}
          {...stat}
          label={t(`activity.stats.${key}`)}
          color={`var(--chart-${i + 1})`}
          loading={loading}
        />
      ))}
    </div>
  );
}

function ActivityByDay({ items, range }: { items: FeedItem[]; range: DateRange | null }) {
  const { t } = useTranslation('crm');
  const to = range?.to ?? startOfDay(new Date());
  const from = range?.from ?? new Date(items.at(-1)?.at ?? to);
  const days = Math.max(1, differenceInCalendarDays(to, from) + 1);
  const data = Array.from({ length: days }, (_, i) => {
    const day = subDays(to, days - 1 - i).toDateString();
    const onDay = items.filter((item) => new Date(item.at).toDateString() === day);
    const counts = countBy(onDay, (item) => item.type);
    return {
      day: shortDate(day),
      ...Object.fromEntries(ACTIVITY_TYPES.map((type) => [type, counts.get(type) ?? 0])),
    };
  });
  return (
    <BarChart
      mode="stacked"
      className="h-64"
      data={data}
      xKey="day"
      barSize={18}
      series={ACTIVITY_TYPES.map((type) => ({
        key: type,
        label: t(`activity.types.${type}`),
        color: TONES[ACTIVITY_TONE[type]],
      }))}
    />
  );
}

export default function ActivityPage() {
  const { t } = useTranslation('crm');
  const feed = useActivityFeed();
  const [type, setType] = useState<ActivityType | 'all'>('all');
  const [owner, setOwner] = useState('all');
  const [range, setRange] = useState<DateRange | null>(() => lastDays(30));
  const [limit, setLimit] = useState(PAGE);

  const all = feed.data ?? [];
  const owners = [...new Set(all.map((i) => i.owner))].sort();
  const inRange = (at: string) =>
    !range?.from ||
    (new Date(at) >= range.from && new Date(at) <= endOfDay(range.to ?? range.from));
  const scoped = all.filter((i) => (owner === 'all' || i.owner === owner) && inRange(i.at));
  const visible = type === 'all' ? scoped : scoped.filter((i) => i.type === type);
  const typeCounts = countBy(scoped, (i) => i.type);
  const repCounts = [...countBy(scoped, (i) => i.owner)].sort((a, b) => b[1] - a[1]);
  const presets = [7, 30, 90].map((days) => ({
    key: `${days}d`,
    label: t('activity.lastDays', { count: days }),
    range: () => lastDays(days),
  }));

  return (
    <Page
      width="full"
      title={t('activity.title')}
      description={t('activity.description')}
      actions={<LogActivityDialog />}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Select value={owner} onValueChange={setOwner}>
          <SelectTrigger className="w-48" aria-label={t('common.owner')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('pipeline.allOwners')}</SelectItem>
            {owners.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DateRangePicker
          value={range}
          onChange={setRange}
          presets={presets}
          placeholder={t('activity.allTime')}
          applyLabel={t('activity.apply')}
          cancelLabel={t('quickAdd.cancel')}
          className="w-full sm:w-auto"
        />
      </div>

      {feed.isError ? (
        <WidgetError onRetry={() => void feed.refetch()} />
      ) : (
        <>
          <ActivityStats items={scoped} loading={!feed.data} />
          <div className="grid gap-4 md:gap-6 lg:grid-cols-12">
            <SectionCard
              title={t('activity.byDay')}
              description={t('activity.byDayHint')}
              className="lg:col-span-8"
            >
              {feed.data ? (
                <ActivityByDay items={scoped} range={range} />
              ) : (
                <Skeleton className="h-64" />
              )}
            </SectionCard>
            <SectionCard title={t('activity.byRep')} className="lg:col-span-4">
              {feed.data ? (
                <MeterList
                  items={repCounts.map(([name, count]) => ({
                    key: name,
                    label: name,
                    value: count,
                    max: repCounts[0]![1],
                    display: count,
                  }))}
                />
              ) : (
                <Skeleton className="h-64" />
              )}
            </SectionCard>
          </div>

          <SectionCard title={t('activity.timeline')}>
            <FilterChips
              label={t('activity.filterType')}
              value={type}
              onChange={(next) => {
                setType(next);
                setLimit(PAGE);
              }}
              options={(['all', ...ACTIVITY_TYPES] as const).map((value) => ({
                value,
                label: value === 'all' ? t('leads.all') : t(`activity.types.${value}`),
                count: value === 'all' ? scoped.length : (typeCounts.get(value) ?? 0),
              }))}
            />
            <div className="mt-6">
              {!feed.data ? (
                <Skeleton className="h-96" />
              ) : visible.length ? (
                <ActivityTimeline items={visible.slice(0, limit)} />
              ) : (
                <EmptyState
                  variant="plain"
                  icon={Activity}
                  title={t('activity.empty')}
                  description={t('activity.emptyHint')}
                />
              )}
            </div>
            {visible.length > limit && (
              <div className="mt-6 flex justify-center">
                <Button variant="outline" onClick={() => setLimit(limit + PAGE)}>
                  {t('activity.showMore', { count: visible.length - limit })}
                </Button>
              </div>
            )}
          </SectionCard>
        </>
      )}
    </Page>
  );
}
