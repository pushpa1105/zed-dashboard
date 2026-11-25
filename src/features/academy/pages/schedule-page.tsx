import { ChevronLeft, ChevronRight, MapPin, Users } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useSearchParams } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { ButtonGroup } from '@/shared/ui/button-group';
import { Skeleton } from '@/shared/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

import { scheduleQuery, useSchedule } from '../api/academy-api';
import { QueryError } from '../components/query-error';
import { minutes, time } from '../lib/format';
import { SESSION_KINDS, type Schedule, type SessionKind } from '../model/academy';

const START_HOUR = 8;
const END_HOUR = 19;
const HOUR_PX = 56;

const KIND_COLOR: Record<SessionKind, string> = {
  live: 'var(--chart-1)',
  'office-hours': 'var(--chart-2)',
  workshop: 'var(--chart-4)',
  exam: 'var(--chart-3)',
};

const weekFrom = (params: URLSearchParams) => {
  const value = Number(params.get('week') ?? 0);
  return Number.isFinite(value) ? Math.max(-8, Math.min(8, Math.round(value))) : 0;
};

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    await queryClient.prefetchQuery(scheduleQuery(weekFrom(new URL(request.url).searchParams)));
    return null;
  };

type Session = Schedule['sessions'][number];

function EventBlock({ session }: { session: Session }) {
  const { t } = useTranslation('academy');
  const start = new Date(session.startsAt);
  const top = (start.getHours() + start.getMinutes() / 60 - START_HOUR) * HOUR_PX;
  const height = Math.max((session.durationMin / 60) * HOUR_PX - 4, 28);
  const color = KIND_COLOR[session.kind];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="absolute inset-x-1 overflow-hidden rounded-md border-l-[3px] px-2 py-1 text-left text-xs transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          style={{
            top: top + 2,
            height,
            borderColor: color,
            background: `color-mix(in srgb, ${color} 13%, var(--card))`,
          }}
        >
          <p className="truncate font-medium">{session.title}</p>
          {height > 44 && (
            <p className="truncate text-muted-foreground tabular-nums">
              {time(session.startsAt)} · {minutes(session.durationMin)}
            </p>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-64">
        <p className="font-medium">{session.title}</p>
        <p>
          {session.instructor} · {session.location}
        </p>
        <p>{t('schedule.attendees', { count: session.attendees })}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function WeekGrid({ data }: { data: Schedule }) {
  const monday = new Date(data.weekStart);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  const today = new Date().toDateString();
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[52rem] grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
        <div />
        {days.map((day) => {
          const isToday = day.toDateString() === today;
          return (
            <div key={day.toISOString()} className="border-b px-2 pb-3 text-center">
              <p className="text-xs text-muted-foreground uppercase">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </p>
              <p
                className={cn(
                  'mx-auto mt-1 flex size-8 items-center justify-center rounded-full text-sm font-semibold tabular-nums',
                  isToday && 'bg-primary text-primary-foreground',
                )}
              >
                {day.getDate()}
              </p>
            </div>
          );
        })}
        <div className="relative">
          {hours.map((hour) => (
            <div key={hour} style={{ height: HOUR_PX }} className="pr-2 text-right">
              <span className="relative -top-2 text-[0.6875rem] text-muted-foreground tabular-nums">
                {hour}:00
              </span>
            </div>
          ))}
        </div>
        {days.map((day) => {
          const sessions = data.sessions.filter(
            (s) => new Date(s.startsAt).toDateString() === day.toDateString(),
          );
          const weekend = day.getDay() === 0 || day.getDay() === 6;
          return (
            <div
              key={day.toISOString()}
              className={cn('relative border-l', weekend && 'bg-muted/40')}
              style={{ height: hours.length * HOUR_PX }}
            >
              {hours.map((hour) => (
                <div key={hour} className="border-b border-dashed" style={{ height: HOUR_PX }} />
              ))}
              {sessions.map((session) => (
                <EventBlock key={session.id} session={session} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Week calendar of live classes, workshops, office hours and exams. */
export default function SchedulePage() {
  const { t } = useTranslation('academy');
  const [params, setParams] = useSearchParams();
  const week = weekFrom(params);
  const query = useSchedule(week);
  const data = query.data;
  const setWeek = (value: number) =>
    setParams(value ? { week: String(value) } : {}, { replace: true });

  const monday = data ? new Date(data.weekStart) : null;
  const sunday = monday ? new Date(monday.getTime() + 6 * 86_400_000) : null;
  const range =
    monday && sunday
      ? `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : '';

  return (
    <Page
      width="full"
      title={t('schedule.title')}
      description={t('schedule.description')}
      actions={
        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-medium tabular-nums sm:inline">{range}</span>
          <ButtonGroup>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeek(week - 1)}
              aria-label={t('schedule.prev')}
            >
              <ChevronLeft />
            </Button>
            <Button variant="outline" onClick={() => setWeek(0)} disabled={week === 0}>
              {t('schedule.today')}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeek(week + 1)}
              aria-label={t('schedule.next')}
            >
              <ChevronRight />
            </Button>
          </ButtonGroup>
        </div>
      }
    >
      {query.isError && !data ? (
        <QueryError onRetry={() => void query.refetch()} />
      ) : !data ? (
        <Skeleton className="h-[40rem] rounded-xl" />
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[1fr_18rem]">
          <SectionCard className="hidden md:flex" contentClassName="pt-6">
            <WeekGrid data={data} />
          </SectionCard>
          <div className="space-y-6">
            <SectionCard title={t('schedule.legend')}>
              <ul className="space-y-2.5">
                {SESSION_KINDS.map((kind) => (
                  <li key={kind} className="flex items-center gap-2.5 text-sm">
                    <span className="size-3 rounded-sm" style={{ background: KIND_COLOR[kind] }} />
                    <span className="flex-1">{t(`kinds.${kind}`)}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {data.sessions.filter((s) => s.kind === kind).length}
                    </span>
                  </li>
                ))}
              </ul>
            </SectionCard>
            <SectionCard title={t('schedule.agenda')} flush>
              <ol className="divide-y">
                {data.sessions.map((session) => (
                  <li key={session.id} className="flex gap-3 px-6 py-3">
                    <span
                      className="mt-1 h-10 w-1 shrink-0 rounded-full"
                      style={{ background: KIND_COLOR[session.kind] }}
                    />
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-sm font-medium">{session.title}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {new Date(session.startsAt).toLocaleDateString('en-US', {
                          weekday: 'short',
                        })}{' '}
                        {time(session.startsAt)} · {minutes(session.durationMin)}
                      </p>
                      <p className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" /> {session.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="size-3" /> {session.attendees}
                        </span>
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </SectionCard>
          </div>
        </div>
      )}
    </Page>
  );
}
