import { MonitorPlay, Phone, Users, type LucideIcon } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { Tag } from '@/shared/components/display/tag';
import { Calendar } from '@/shared/ui/calendar';
import { Skeleton } from '@/shared/ui/skeleton';

import { meetingsQuery, useMeetings } from '../api/crm-api';
import { WidgetError } from '../components/crm-parts';
import { LogCallDialog } from '../components/log-call-dialog';
import { shortDate, time } from '../lib/format';
import type { Meeting } from '../model/crm';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(meetingsQuery());
    return null;
  };

const KIND: Record<Meeting['kind'], { icon: LucideIcon; tone: 'blue' | 'violet' | 'aqua' }> = {
  call: { icon: Phone, tone: 'aqua' },
  meeting: { icon: Users, tone: 'blue' },
  demo: { icon: MonitorPlay, tone: 'violet' },
};

const dayKey = (iso: string) => new Date(iso).toDateString();

function AgendaDay({ items }: { items: Meeting[] }) {
  const { t, i18n } = useTranslation('crm');
  const date = new Date(items[0]!.startsAt);
  return (
    <div className="grid gap-4 py-5 first:pt-0 last:pb-0 sm:grid-cols-[4.5rem_minmax(0,1fr)]">
      <div className="flex items-baseline gap-2 sm:block">
        <p className="text-3xl leading-none font-semibold tracking-tight tabular-nums">
          {date.getDate()}
        </p>
        <p className="text-sm text-muted-foreground sm:mt-1">
          {date.toLocaleDateString(i18n.language, { weekday: 'short', month: 'short' })}
        </p>
      </div>
      <ul className="space-y-2">
        {items.map((m) => {
          const kind = KIND[m.kind];
          return (
            <li
              key={m.id}
              className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3"
            >
              <span className="w-16 shrink-0 text-sm font-medium tabular-nums">
                {time(m.startsAt)}
              </span>
              <kind.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {m.with} · {m.company}
                </p>
              </div>
              <Tag size="sm" tone={kind.tone} className="hidden sm:inline-flex">
                {t(`meetings.kind.${m.kind}`)}
              </Tag>
              <span className="hidden w-14 text-right text-xs text-muted-foreground md:block">
                {t('meetings.minutes', { count: m.durationMin })}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function MeetingsPage() {
  const { t } = useTranslation('crm');
  const meetings = useMeetings();
  const [now] = useState(() => Date.now());
  const all = meetings.data ?? [];
  const upcoming = all.filter((m) => Date.parse(m.startsAt) >= now);
  const past = all.filter((m) => Date.parse(m.startsAt) < now).reverse();
  const days = Array.from(
    upcoming
      .reduce(
        (map, m) => map.set(dayKey(m.startsAt), [...(map.get(dayKey(m.startsAt)) ?? []), m]),
        new Map<string, Meeting[]>(),
      )
      .values(),
  );

  return (
    <Page
      width="full"
      title={t('meetings.title')}
      description={t('meetings.description')}
      actions={<LogCallDialog />}
    >
      {meetings.isError ? (
        <WidgetError onRetry={() => void meetings.refetch()} />
      ) : (
        <div className="grid items-start gap-4 md:gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <SectionCard title={t('meetings.upcoming')} className="divide-y-0">
            {meetings.data ? (
              <div className="divide-y">
                {days.map((items) => (
                  <AgendaDay key={dayKey(items[0]!.startsAt)} items={items} />
                ))}
              </div>
            ) : (
              <Skeleton className="h-96" />
            )}
          </SectionCard>
          <div className="space-y-4 md:space-y-6">
            <SectionCard contentClassName="flex justify-center">
              <Calendar
                mode="single"
                className="p-0 [--cell-size:--spacing(9)]"
                modifiers={{ busy: all.map((m) => new Date(m.startsAt)) }}
                modifiersClassNames={{
                  busy: '[&>button]:font-semibold [&>button]:text-primary [&>button]:bg-primary/10',
                }}
              />
            </SectionCard>
            <SectionCard title={t('meetings.past')} flush>
              <ul className="divide-y border-t">
                {past.slice(0, 7).map((m) => (
                  <li key={m.id} className="flex items-center gap-3 px-6 py-3">
                    <InitialsAvatar name={m.with} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.with} · {shortDate(m.startsAt)}
                      </p>
                    </div>
                    <Tag
                      size="sm"
                      tone={
                        m.outcome === 'No answer' || m.outcome === 'Sin respuesta'
                          ? 'neutral'
                          : m.outcome?.startsWith('Needs') || m.outcome?.startsWith('Requiere')
                            ? 'warning'
                            : 'success'
                      }
                    >
                      {m.outcome ?? t('meetings.noOutcome')}
                    </Tag>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>
        </div>
      )}
    </Page>
  );
}
