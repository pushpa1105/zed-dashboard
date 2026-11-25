import {
  CalendarClock,
  ChartColumnBig,
  DollarSign,
  Filter,
  Megaphone,
  MoreHorizontal,
  Trash2,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { EmptyState } from '@/shared/components/display/empty-state';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { Tag } from '@/shared/components/display/tag';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Skeleton } from '@/shared/ui/skeleton';

import { reportsQuery, useRemoveReport, useReports } from '../api/analytics-api';
import { QueryError } from '../components/query-error';
import { RangeControl } from '../components/range-control';
import { ScheduleDialog } from '../components/schedule-dialog';
import { shortDate } from '../lib/format';
import type { Report } from '../model/analytics';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(reportsQuery());
    return null;
  };

const TYPE_ICON: Record<Report['type'], LucideIcon> = {
  traffic: ChartColumnBig,
  acquisition: Megaphone,
  revenue: DollarSign,
  funnel: Filter,
  custom: Wrench,
};

type View = 'all' | 'scheduled' | 'manual';

function ReportCard({ report, onSchedule }: { report: Report; onSchedule: () => void }) {
  const { t } = useTranslation('analytics');
  const remove = useRemoveReport();
  const Icon = TYPE_ICON[report.type];

  return (
    <article className="flex flex-col rounded-xl border bg-card shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex items-start gap-3 p-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{report.name}</h3>
          <p className="text-xs text-muted-foreground">{t(`reports.types.${report.type}`)}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={t('reports.actions')}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onSchedule}>
              <CalendarClock /> {t('reports.schedule.title')}
            </DropdownMenuItem>
            <ConfirmDialog
              trigger={
                <DropdownMenuItem variant="destructive" onSelect={(e) => e.preventDefault()}>
                  <Trash2 /> {t('reports.delete')}
                </DropdownMenuItem>
              }
              title={t('reports.deleteTitle', { name: report.name })}
              description={t('reports.deleteDescription')}
              confirmLabel={t('reports.delete')}
              cancelLabel={t('reports.schedule.cancel')}
              destructive
              pending={remove.isPending}
              onConfirm={() => remove.mutateAsync(report.id)}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t px-5 py-3">
        <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <InitialsAvatar name={report.owner} size="xs" />
          <span className="truncate">
            {report.owner} · {shortDate(report.updatedAt)}
          </span>
        </span>
        {report.schedule ? (
          <button type="button" onClick={onSchedule}>
            <Tag tone="success" dot size="sm">
              {t(`reports.frequency.${report.schedule.frequency}`)}
            </Tag>
          </button>
        ) : (
          <Button variant="link" size="xs" className="h-auto px-0" onClick={onSchedule}>
            {t('reports.addSchedule')}
          </Button>
        )}
      </div>
    </article>
  );
}

/** Saved reports and their email schedules. */
export default function ReportsPage() {
  const { t } = useTranslation('analytics');
  const reports = useReports();
  const [view, setView] = useState<View>('all');
  const [scheduling, setScheduling] = useState<Report | null>(null);
  const data = reports.data;
  const visible = (data ?? []).filter((r) =>
    view === 'all' ? true : view === 'scheduled' ? !!r.schedule : !r.schedule,
  );

  return (
    <Page
      width="full"
      title={t('reports.title')}
      description={t('reports.description')}
      actions={<RangeControl />}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          value={view}
          onChange={setView}
          options={(['all', 'scheduled', 'manual'] as const).map((value) => ({
            value,
            label: t(`reports.views.${value}`),
          }))}
        />
        {data && (
          <p className="text-sm text-muted-foreground">
            {t('reports.count', { count: data.filter((r) => r.schedule).length })}
          </p>
        )}
      </div>
      {reports.isError && !data ? (
        <QueryError onRetry={() => void reports.refetch()} />
      ) : !data ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={t('reports.empty.title')}
          description={t('reports.empty.description')}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((report) => (
            <ReportCard key={report.id} report={report} onSchedule={() => setScheduling(report)} />
          ))}
        </div>
      )}
      <ScheduleDialog report={scheduling} onClose={() => setScheduling(null)} />
    </Page>
  );
}
