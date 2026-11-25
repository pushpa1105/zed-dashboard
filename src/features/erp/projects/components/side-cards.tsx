import { useTranslation } from '@/core/i18n/use-translation';
import { AreaChart } from '@/shared/components/charts/area-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { formatRelative, getInitials } from '@/shared/lib/format';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Calendar } from '@/shared/ui/calendar';
import { Skeleton } from '@/shared/ui/skeleton';

import { shortDate } from '../lib/format';
import type { ProjectsOverview } from '../model/projects';

const toDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
};

export function DeadlinesCard({ deadlines }: { deadlines?: string[] }) {
  const { t } = useTranslation('erp', { keyPrefix: 'projects' });
  const days = deadlines?.map(toDate) ?? [];

  return (
    <SectionCard
      title={t('calendar.title')}
      description={t('calendar.description')}
      className="lg:col-span-4"
      contentClassName="flex justify-center"
    >
      {deadlines ? (
        <Calendar
          mode="single"
          defaultMonth={days[0]}
          className="w-full p-0 [--cell-size:--spacing(9)]"
          modifiers={{ deadline: days }}
          modifiersClassNames={{
            deadline:
              '[&>button]:bg-primary/10 [&>button]:font-semibold [&>button]:text-primary relative',
          }}
        />
      ) : (
        <Skeleton className="h-72 w-full" />
      )}
    </SectionCard>
  );
}

export function AnalysisCard({ analysis }: { analysis?: ProjectsOverview['analysis'] }) {
  const { t } = useTranslation('erp', { keyPrefix: 'projects' });
  return (
    <SectionCard
      title={t('analysis.title')}
      description={t('analysis.description')}
      className="lg:col-span-5"
    >
      {analysis ? (
        <AreaChart
          className="h-56"
          data={analysis}
          xKey="day"
          series={[
            { key: 'hours', label: t('analysis.hours'), color: 'var(--chart-1)' },
            { key: 'planned', label: t('analysis.planned'), color: 'var(--chart-2)' },
          ]}
          valueFormatter={(v) => `${v}h`}
        />
      ) : (
        <Skeleton className="h-56 w-full" />
      )}
    </SectionCard>
  );
}

export function ClientsCard({ clients }: { clients?: ProjectsOverview['clients'] }) {
  const { t } = useTranslation('erp', { keyPrefix: 'projects' });
  return (
    <SectionCard title={t('clients.title')} className="lg:col-span-3">
      {clients ? (
        <ul className="space-y-4">
          {clients.map((client) => (
            <li key={client.id} className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarFallback className="bg-accent text-xs text-accent-foreground">
                  {getInitials(...client.name.split(' '))}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{client.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {client.company} · {t('clients.since', { date: shortDate(client.since) })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Skeleton className="h-48 w-full" />
      )}
    </SectionCard>
  );
}

export function ActivityCard({ activity }: { activity?: ProjectsOverview['activity'] }) {
  const { t } = useTranslation('erp', { keyPrefix: 'projects' });
  return (
    <SectionCard title={t('activity.title')} className="lg:col-span-4">
      {activity ? (
        <ol className="relative space-y-5 before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-px before:bg-border">
          {activity.map((item, i) => (
            <li key={item.id} className="relative flex gap-3 pl-5">
              <span
                className="absolute top-1.5 left-0 size-[11px] rounded-full border-2 border-card"
                style={{ background: i === 0 ? 'var(--primary)' : 'var(--muted-foreground)' }}
              />
              <div className="min-w-0 text-sm">
                <p className="leading-snug">
                  <span className="font-medium">{item.actor}</span>{' '}
                  <span className="text-muted-foreground">{item.action}</span> {item.target}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{formatRelative(item.at)}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <Skeleton className="h-56 w-full" />
      )}
    </SectionCard>
  );
}
