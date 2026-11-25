import { Search } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Sparkline } from '@/shared/components/charts/sparkline';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { TrendBadge } from '@/shared/components/dashboard/trend-badge';
import { EmptyState } from '@/shared/components/display/empty-state';
import { Tag } from '@/shared/components/display/tag';
import type { Tone } from '@/shared/components/display/tone';
import { SearchInput } from '@/shared/components/forms/search-input';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { eventsQuery, useEvents } from '../api/analytics-api';
import { EventSheet } from '../components/event-sheet';
import { QueryError } from '../components/query-error';
import { RangeControl } from '../components/range-control';
import { rangeFromRequest, useRangeParams } from '../hooks/use-range';
import { compact, integer } from '../lib/format';
import { EVENT_CATEGORIES, type EventRow } from '../model/analytics';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    await queryClient.prefetchQuery(eventsQuery(rangeFromRequest(request)));
    return null;
  };

type Category = 'all' | EventRow['category'];

const CATEGORY_TONE: Record<EventRow['category'], Tone> = {
  engagement: 'info',
  conversion: 'success',
  system: 'warning',
};

/** Every tracked event with its volume and trend; click one for its property breakdown. */
export default function EventsPage() {
  const { t } = useTranslation('analytics');
  const { range } = useRangeParams();
  const query = useEvents(range);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [open, setOpen] = useState<EventRow | null>(null);
  const data = query.data;

  const needle = search.trim().toLowerCase();
  const rows = (data ?? []).filter(
    (e) =>
      (category === 'all' || e.category === category) &&
      (e.label.toLowerCase().includes(needle) || e.key.includes(needle)),
  );
  const total = (data ?? []).reduce((sum, e) => sum + e.count, 0);

  return (
    <Page
      width="full"
      title={t('events.title')}
      description={t('events.description')}
      actions={<RangeControl />}
    >
      {query.isError && !data ? (
        <QueryError onRetry={() => void query.refetch()} />
      ) : !data ? (
        <Skeleton className="h-[32rem] rounded-xl" />
      ) : (
        <SectionCard flush>
          <StatStrip
            className="border-b px-6"
            items={[
              { key: 'total', label: t('events.kpis.total'), value: compact(total) },
              { key: 'tracked', label: t('events.kpis.tracked'), value: data.length },
              {
                key: 'conversions',
                label: t('events.kpis.conversions'),
                value: compact(
                  data.filter((e) => e.category === 'conversion').reduce((s, e) => s + e.count, 0),
                ),
              },
            ]}
          />
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('events.search')}
              aria-label={t('events.search')}
              containerClassName="sm:max-w-xs"
            />
            <div className="scrollbar-none overflow-x-auto">
              <SegmentedControl
                size="sm"
                value={category}
                onChange={setCategory}
                aria-label={t('events.category')}
                options={(['all', ...EVENT_CATEGORIES] as const).map((value) => ({
                  value,
                  label: t(`events.categories.${value}`),
                }))}
              />
            </div>
          </div>
          {rows.length === 0 ? (
            <EmptyState
              variant="plain"
              icon={Search}
              title={t('events.empty.title')}
              description={t('events.empty.description')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">{t('events.table.event')}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t('events.table.category')}
                  </TableHead>
                  <TableHead className="text-right">{t('events.table.count')}</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">
                    {t('events.table.users')}
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">{t('events.table.trend')}</TableHead>
                  <TableHead className="pr-6 text-right">{t('events.table.change')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((event) => (
                  <TableRow key={event.key}>
                    <TableCell className="pl-6">
                      <button
                        type="button"
                        className="text-left hover:underline focus-visible:underline focus-visible:outline-none"
                        onClick={() => setOpen(event)}
                      >
                        <span className="block font-medium">{event.label}</span>
                        <span className="block font-mono text-xs text-muted-foreground">
                          {event.key}
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Tag size="sm" tone={CATEGORY_TONE[event.category]}>
                        {t(`events.categories.${event.category}`)}
                      </Tag>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {integer(event.count)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      {integer(event.users)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Sparkline
                        data={event.trend}
                        variant="line"
                        label={t('events.table.trendLabel', { event: event.label })}
                      />
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <TrendBadge delta={event.delta} invert={event.category === 'system'} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>
      )}
      <EventSheet event={open} range={range} onClose={() => setOpen(null)} />
    </Page>
  );
}
