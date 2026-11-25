import { CalendarClock, Eye, Ticket, UsersRound } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useSearchParams } from '@/core/router/router';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { Callout } from '@/shared/components/display/callout';
import { EmptyState } from '@/shared/components/display/empty-state';
import { Skeleton } from '@/shared/ui/skeleton';

import { liveQuery, useLiveSessions } from '../api/teaching-api';
import { FilterTabs } from '../components/filter-tabs';
import { LiveAction } from '../components/live-action';
import { LiveSessionSheet } from '../components/live-session-sheet';
import { LiveSessionsTable } from '../components/live-sessions-table';
import { QueryState } from '../components/query-state';
import { ScheduleLiveDialog } from '../components/schedule-live-dialog';
import { compact, rate } from '../lib/format';
import {
  isJoinable,
  isPast,
  LIVE_FILTERS,
  type LiveFilter,
  type LiveSession,
} from '../model/teaching';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(liveQuery());
    return null;
  };

const MATCHES: Record<LiveFilter, (s: LiveSession) => boolean> = {
  upcoming: (s) => !isPast(s),
  past: isPast,
  going: (s) => s.going && !isPast(s),
};

const parseFilter = (value: string | null): LiveFilter =>
  LIVE_FILTERS.find((f) => f === value) ?? 'upcoming';

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function LiveSessions({ sessions }: { sessions: LiveSession[] }) {
  const { t } = useTranslation('academy');
  const [params, setParams] = useSearchParams();
  const [openId, setOpenId] = useState<string | null>(null);
  const filter = parseFilter(params.get('status'));
  const past = sessions.filter(isPast);
  const upcoming = sessions.filter((s) => !isPast(s));
  // Past sessions read best newest first; upcoming ones soonest first.
  const rows = sessions.filter(MATCHES[filter]);
  if (filter === 'past') rows.reverse();
  const attended = past.reduce((sum, s) => sum + (s.attended ?? 0), 0);
  const registered = past.reduce((sum, s) => sum + s.registered, 0);
  const live = upcoming.find(isJoinable);

  const stats = [
    { key: 'upcoming', icon: CalendarClock, value: upcoming.length },
    { key: 'going', icon: Ticket, value: upcoming.filter((s) => s.going).length },
    { key: 'attendance', icon: UsersRound, value: `${rate(attended, registered)}%` },
    {
      key: 'views',
      icon: Eye,
      value: compact(past.reduce((sum, s) => sum + (s.recording?.views ?? 0), 0)),
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ key, icon, value }) => (
          <StatCard
            key={key}
            variant="tile"
            icon={icon}
            label={t(`live.stats.${key}`)}
            value={value}
          />
        ))}
      </div>
      {live && (
        <Callout
          kind="info"
          title={t('live.now', { title: live.title })}
          actions={<LiveAction session={live} />}
        >
          {live.host.name} · {live.courseTitle}
        </Callout>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_22rem]">
        <SectionCard
          flush
          title={t('live.table.title')}
          description={t('live.table.count', { count: rows.length })}
          action={
            <FilterTabs
              label={t('live.table.filter')}
              value={filter}
              onChange={(status) => setParams({ status }, { replace: true })}
              tabs={LIVE_FILTERS.map((value) => ({
                value,
                label: t(`live.filters.${value}`),
                count: sessions.filter(MATCHES[value]).length,
              }))}
            />
          }
        >
          {rows.length ? (
            <LiveSessionsTable
              rows={rows}
              past={filter === 'past'}
              onOpen={(s) => setOpenId(s.id)}
            />
          ) : (
            <EmptyState
              variant="plain"
              icon={CalendarClock}
              title={t('live.empty.title')}
              description={t('live.empty.description')}
            />
          )}
        </SectionCard>
        <SectionCard title={t('live.chart.title')} description={t('live.chart.description')}>
          <BarChart
            data={past.slice(-8).map((s) => ({
              date: shortDate(s.startsAt),
              registered: s.registered,
              attended: s.attended ?? 0,
            }))}
            xKey="date"
            series={[
              {
                key: 'registered',
                label: t('live.chart.registered'),
                color: 'var(--muted-foreground)',
              },
              { key: 'attended', label: t('live.chart.attended') },
            ]}
            className="h-64"
            barSize={12}
            legend
          />
        </SectionCard>
      </div>
      <LiveSessionSheet
        session={sessions.find((s) => s.id === openId) ?? null}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}

/** Live classes: what is coming up, what you signed up for, and recordings of past ones. */
export default function LivePage() {
  const { t } = useTranslation('academy');
  const query = useLiveSessions();
  const courses = [
    ...new Map((query.data ?? []).map((s) => [s.courseId, s.courseTitle])).entries(),
  ].map(([id, title]) => ({ id, title }));

  return (
    <Page
      width="full"
      title={t('live.title')}
      description={t('live.description')}
      actions={courses.length > 0 && <ScheduleLiveDialog courses={courses} />}
    >
      <QueryState
        query={query}
        skeleton={
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-[28rem] rounded-xl" />
          </div>
        }
      >
        {(sessions) => <LiveSessions sessions={sessions} />}
      </QueryState>
    </Page>
  );
}
