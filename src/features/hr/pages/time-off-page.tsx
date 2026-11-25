import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { EmptyState } from '@/shared/components/display/empty-state';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

import { timeOffQuery, useDecideTimeOff, useTimeOff } from '../api/hr-api';
import { WidgetError } from '../components/widget-error';
import { longDate, shortDate } from '../lib/format';
import { groupBy } from '../lib/group-by';
import { LEAVE_COLOR, LEAVE_TYPES, type TimeOffRequest } from '../model/hr';
import { hrRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(timeOffQuery());
    return null;
  };

const DAY = 86_400_000;
const utc = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

function TeamCalendar({ requests }: { requests: TimeOffRequest[] }) {
  const { t, i18n } = useTranslation('hr');
  const now = new Date();
  const [month, setMonth] = useState(() => Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const first = new Date(month);
  const daysInMonth = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const monthEnd = month + (daysInMonth - 1) * DAY;
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const todayIndex = todayUtc >= month && todayUtc <= monthEnd ? (todayUtc - month) / DAY : -1;

  const rows = useMemo(() => {
    const visible = requests.filter(
      (r) => r.status !== 'declined' && utc(r.end) >= month && utc(r.start) <= monthEnd,
    );
    return [...groupBy(visible, (r) => r.personId).values()].sort(
      (a, b) => utc(a[0]!.start) - utc(b[0]!.start),
    );
  }, [requests, month, monthEnd]);

  const shift = (delta: number) =>
    setMonth(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + delta, 1));
  const grid = { gridTemplateColumns: `repeat(${daysInMonth}, minmax(1.75rem, 1fr))` };
  const days = Array.from({ length: daysInMonth }, (_, i) => new Date(month + i * DAY));

  return (
    <SectionCard
      flush
      title={first.toLocaleDateString(i18n.language, {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      })}
      action={
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t('timeOff.previous')}
            onClick={() => shift(-1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMonth(Date.UTC(now.getFullYear(), now.getMonth(), 1))}
          >
            {t('timeOff.today')}
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t('timeOff.next')}
            onClick={() => shift(1)}
          >
            <ChevronRight />
          </Button>
        </div>
      }
    >
      <div className="flex flex-wrap gap-x-5 gap-y-2 px-6 pb-4">
        {LEAVE_TYPES.map((type) => (
          <span
            key={type}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span className="size-2.5 rounded-sm" style={{ background: LEAVE_COLOR[type] }} />
            {t(`leave.${type}`)}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2.5 rounded-sm border border-dashed border-foreground/40" />
          {t('timeOff.status.pending')}
        </span>
      </div>
      <div className="overflow-x-auto border-t">
        <div className="grid min-w-[60rem] grid-cols-[13rem_minmax(0,1fr)]">
          <div className="sticky left-0 z-10 border-r border-b bg-card" />
          <div className="grid border-b" style={grid}>
            {days.map((d, i) => {
              const weekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;
              return (
                <div
                  key={i}
                  className={cn(
                    'py-2 text-center text-[0.6875rem] leading-tight text-muted-foreground',
                    weekend && 'bg-muted/50',
                    i === todayIndex && 'bg-primary/10 font-semibold text-primary',
                  )}
                >
                  <span className="block">
                    {d.toLocaleDateString(i18n.language, { weekday: 'narrow', timeZone: 'UTC' })}
                  </span>
                  <span className="block tabular-nums">{d.getUTCDate()}</span>
                </div>
              );
            })}
          </div>
          {rows.map((personRequests) => {
            const person = personRequests[0]!;
            return (
              <div key={person.personId} className="contents">
                <Link
                  to={hrRoutes.person.href({ personId: person.personId })}
                  className="sticky left-0 z-10 flex items-center gap-2.5 border-r border-b bg-card px-4 py-2.5 hover:bg-muted/50"
                >
                  <InitialsAvatar name={person.name} size="xs" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{person.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {person.department}
                    </span>
                  </span>
                </Link>
                <div className="relative grid border-b" style={grid}>
                  {days.map((d, i) => (
                    <div
                      key={i}
                      className={cn(
                        'border-r border-border/40 last:border-r-0',
                        (d.getUTCDay() === 0 || d.getUTCDay() === 6) && 'bg-muted/50',
                        i === todayIndex && 'bg-primary/5',
                      )}
                      style={{ gridRow: 1, gridColumn: i + 1 }}
                    />
                  ))}
                  {personRequests.map((r) => {
                    const start = Math.max(0, (utc(r.start) - month) / DAY);
                    const end = Math.min(daysInMonth - 1, (utc(r.end) - month) / DAY);
                    const pending = r.status === 'pending';
                    return (
                      <Tooltip key={r.id}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'z-[1] mx-0.5 my-2 flex items-center overflow-hidden rounded-md px-2 text-[0.6875rem] font-medium whitespace-nowrap text-overlay-foreground',
                              pending && 'border border-dashed border-current bg-transparent!',
                            )}
                            style={{
                              gridRow: 1,
                              gridColumn: `${start + 1} / ${end + 2}`,
                              background: LEAVE_COLOR[r.type],
                              color: pending ? LEAVE_COLOR[r.type] : undefined,
                            }}
                          >
                            {end - start >= 2 && t(`leave.${r.type}`)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t(`leave.${r.type}`)} · {longDate(r.start)} – {longDate(r.end)} ·{' '}
                          {t(`timeOff.status.${r.status}`)}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}

function ApprovalQueue({ requests }: { requests: TimeOffRequest[] }) {
  const { t } = useTranslation('hr');
  const decide = useDecideTimeOff();
  const pending = requests.filter((r) => r.status === 'pending');
  return (
    <SectionCard
      title={t('timeOff.queue')}
      description={t('timeOff.queueDescription')}
      flush
      action={
        <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium tabular-nums">
          {pending.length}
        </span>
      }
    >
      {pending.length ? (
        <ul className="divide-y border-t">
          {pending.map((r) => (
            <li key={r.id} className="space-y-3 px-6 py-4">
              <div className="flex items-start gap-3">
                <InitialsAvatar name={r.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium" style={{ color: LEAVE_COLOR[r.type] }}>
                      {t(`leave.${r.type}`)}
                    </span>{' '}
                    · {shortDate(r.start)} – {shortDate(r.end)} ·{' '}
                    {t('common.days', { count: r.days })}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{r.note}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ id: r.id, status: 'declined' })}
                >
                  <X /> {t('timeOff.decline')}
                </Button>
                <Button
                  size="sm"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ id: r.id, status: 'approved' })}
                >
                  <Check /> {t('timeOff.approve')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          variant="plain"
          icon={Check}
          title={t('timeOff.noPending')}
          className="border-t py-10"
        />
      )}
    </SectionCard>
  );
}

export default function TimeOffPage() {
  const { t } = useTranslation('hr');
  const timeOff = useTimeOff();
  const today = new Date().toISOString().slice(0, 10);
  const outToday = (timeOff.data ?? []).filter(
    (r) => r.status === 'approved' && r.start <= today && r.end >= today,
  );

  return (
    <Page width="full" title={t('timeOff.title')} description={t('timeOff.description')}>
      {timeOff.isError ? (
        <WidgetError onRetry={() => void timeOff.refetch()} />
      ) : !timeOff.data ? (
        <Skeleton className="h-[32rem] w-full rounded-xl" />
      ) : (
        <div className="grid items-start gap-4 md:gap-6 2xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="order-2 min-w-0 2xl:order-1">
            <TeamCalendar requests={timeOff.data} />
          </div>
          <div className="order-1 grid items-start gap-4 md:gap-6 lg:grid-cols-2 2xl:order-2 2xl:grid-cols-1">
            <ApprovalQueue requests={timeOff.data} />
            <SectionCard title={t('timeOff.outToday')}>
              {outToday.length ? (
                <ul className="space-y-3">
                  {outToday.map((r) => (
                    <li key={r.id} className="flex items-center gap-3">
                      <InitialsAvatar name={r.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t(`leave.${r.type}`)} · {shortDate(r.end)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </SectionCard>
          </div>
        </div>
      )}
    </Page>
  );
}
