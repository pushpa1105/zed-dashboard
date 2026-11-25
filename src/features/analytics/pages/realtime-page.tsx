import {
  CreditCard,
  Eye,
  Monitor,
  Pause,
  Play,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Tablet,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { realtimeQuery, useRealtime } from '../api/analytics-api';
import { QueryError } from '../components/query-error';
import { ago, integer } from '../lib/format';
import type { EventType, Realtime } from '../model/analytics';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(realtimeQuery());
    return null;
  };

const EVENT_ICON: Record<EventType, LucideIcon> = {
  page_view: Eye,
  signup: UserPlus,
  add_to_cart: ShoppingCart,
  purchase: CreditCard,
  trial_start: Sparkles,
};
const DEVICE_ICON = { desktop: Monitor, mobile: Smartphone, tablet: Tablet } as const;

function LiveDot({ live }: { live: boolean }) {
  return (
    <span className="relative flex size-2.5">
      {live && (
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
      )}
      <span
        className={cn(
          'relative inline-flex size-2.5 rounded-full',
          live ? 'bg-success' : 'bg-muted-foreground',
        )}
      />
    </span>
  );
}

function ActiveUsersCard({ data, live }: { data: Realtime; live: boolean }) {
  const { t } = useTranslation('analytics');
  const total = data.devices.reduce((sum, d) => sum + d.value, 0) || 1;
  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          <LiveDot live={live} /> {t('realtime.active.title')}
        </span>
      }
      description={t('realtime.active.description')}
    >
      <div className="grid gap-6 md:grid-cols-[14rem_1fr]">
        <div className="flex flex-col justify-between gap-6">
          <div>
            <p className="text-6xl leading-none font-semibold tracking-tight tabular-nums">
              {integer(data.activeUsers)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{t('realtime.active.hint')}</p>
          </div>
          <ul className="space-y-3">
            {data.devices.map((device) => {
              const Icon = DEVICE_ICON[device.key];
              const share = Math.round((device.value / total) * 100);
              return (
                <li key={device.key} className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <Icon className="size-4 text-muted-foreground" />
                    <span>{t(`realtime.devices.${device.key}`)}</span>
                    <span className="ml-auto font-medium tabular-nums">{share}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-700"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="min-w-0">
          <p className="mb-2 text-xs text-muted-foreground">{t('realtime.active.perMinute')}</p>
          <BarChart
            data={data.perMinute}
            xKey="minute"
            series={[{ key: 'users', label: t('realtime.active.users') }]}
            highlight="last"
            barSize={14}
            radius={3}
            className="h-64"
          />
        </div>
      </div>
    </SectionCard>
  );
}

function EventStream({ data }: { data: Realtime }) {
  const { t } = useTranslation('analytics');
  return (
    <SectionCard
      title={t('realtime.stream.title')}
      description={t('realtime.stream.description')}
      flush
    >
      <ol className="max-h-[38rem] divide-y overflow-y-auto">
        {data.events.map((event) => {
          const Icon = EVENT_ICON[event.type];
          return (
            <li
              key={event.id}
              className="flex animate-in items-start gap-3 px-6 py-3 duration-500 fade-in"
            >
              <span
                className={cn(
                  'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground',
                  event.type === 'purchase' && 'bg-success/12 text-success',
                  event.type === 'signup' && 'bg-primary/10 text-primary',
                )}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-medium">{t(`realtime.events.${event.type}`)}</span>{' '}
                  <span className="font-mono text-xs text-muted-foreground">{event.page}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {event.country} · {t(`realtime.devices.${event.device}`)}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {t('realtime.stream.ago', { value: ago(event.at) })}
              </span>
            </li>
          );
        })}
      </ol>
    </SectionCard>
  );
}

function TopPagesNow({ data }: { data: Realtime }) {
  const { t } = useTranslation('analytics');
  const max = Math.max(...data.topPages.map((p) => p.users), 1);
  return (
    <SectionCard
      title={t('realtime.topPages.title')}
      description={t('realtime.topPages.description')}
    >
      <ol className="grid gap-x-8 gap-y-3 md:grid-cols-2">
        {data.topPages.map((page, i) => (
          <li key={page.path} className="flex items-center gap-3">
            <span className="w-4 text-xs text-muted-foreground tabular-nums">{i + 1}</span>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-mono text-[0.8125rem]">{page.path}</span>
                <span className="font-medium tabular-nums">{page.users}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-chart-2 transition-[width] duration-700"
                  style={{ width: `${(page.users / max) * 100}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}

/** Live view: who is on the site right now, refreshed every 5 seconds. */
export default function RealtimePage() {
  const { t } = useTranslation('analytics');
  const [live, setLive] = useState(true);
  const realtime = useRealtime(live);
  const data = realtime.data;

  return (
    <Page
      width="full"
      title={t('realtime.title')}
      description={t('realtime.description')}
      actions={
        <Button variant="outline" onClick={() => setLive((value) => !value)}>
          {live ? <Pause /> : <Play />}
          {live ? t('realtime.pause') : t('realtime.resume')}
        </Button>
      }
    >
      {realtime.isError && !data ? (
        <QueryError onRetry={() => void realtime.refetch()} />
      ) : !data ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
          <Skeleton className="h-[40rem] rounded-xl lg:row-span-2" />
          <Skeleton className="h-56 rounded-xl lg:col-span-2" />
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <ActiveUsersCard data={data} live={live} />
            <TopPagesNow data={data} />
          </div>
          <EventStream data={data} />
        </div>
      )}
    </Page>
  );
}
