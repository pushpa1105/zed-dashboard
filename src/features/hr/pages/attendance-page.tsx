import {
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Flame,
  Hourglass,
} from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { EmptyState } from '@/shared/components/display/empty-state';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { attendanceQuery, useApproveTimesheets, useAttendance } from '../api/workforce-api';
import { TimesheetTable } from '../components/timesheet-table';
import { WidgetError } from '../components/widget-error';
import { daysUntil, hours, shortDate } from '../lib/format';
import { hasOvertime, weekTotal, type Timesheet } from '../model/workforce';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(attendanceQuery(0));
    return null;
  };

const FILTERS = {
  all: () => true,
  submitted: (s: Timesheet) => s.status === 'submitted',
  overtime: hasOvertime,
};
type Filter = keyof typeof FILTERS;

export default function AttendancePage() {
  const { t } = useTranslation('hr');
  const [week, setWeek] = useState(0);
  const [filter, setFilter] = useState<Filter>('all');
  const attendance = useAttendance(week);
  const approve = useApproveTimesheets();

  const sheets = attendance.data?.timesheets ?? [];
  const submitted = sheets.filter(FILTERS.submitted);
  const visible = sheets.filter(FILTERS[filter]);
  const weekStart = attendance.data?.weekStart;
  const weekEnd = weekStart && new Date(Date.parse(weekStart) + 6 * 86_400_000).toISOString();
  const loading = !attendance.data;

  const stats = [
    {
      key: 'in',
      icon: Clock,
      color: 'var(--success)',
      value: sheets.filter((s) => s.clock?.status === 'in').length,
    },
    {
      key: 'break',
      icon: Coffee,
      color: 'var(--warning)',
      value: sheets.filter((s) => s.clock?.status === 'break').length,
    },
    {
      key: 'logged',
      icon: Hourglass,
      color: 'var(--chart-1)',
      value: hours(sheets.reduce((sum, s) => sum + weekTotal(s), 0)),
    },
    {
      key: 'overtime',
      icon: Flame,
      color: 'var(--destructive)',
      value: sheets.filter(hasOvertime).length,
    },
  ] as const;

  return (
    <Page width="full" title={t('attendance.title')} description={t('attendance.description')}>
      <div className="grid grid-cols-2 gap-4 md:gap-6 xl:grid-cols-4">
        {stats.map(({ key, ...stat }) => (
          <StatCard
            key={key}
            {...stat}
            label={t(`attendance.stats.${key}`)}
            hint={
              week !== 0 && (key === 'in' || key === 'break') ? t('attendance.liveOnly') : undefined
            }
            loading={loading}
          />
        ))}
      </div>

      <SectionCard
        flush
        title={t('attendance.timesheets')}
        description={
          weekStart && weekEnd
            ? t('attendance.week', { from: shortDate(weekStart), to: shortDate(weekEnd) })
            : undefined
        }
        action={
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={t('attendance.previousWeek')}
              onClick={() => setWeek((w) => w - 1)}
            >
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="sm" disabled={week === 0} onClick={() => setWeek(0)}>
              {t('attendance.thisWeek')}
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={t('attendance.nextWeek')}
              disabled={week === 0}
              onClick={() => setWeek((w) => w + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-4">
          <SegmentedControl
            size="sm"
            value={filter}
            onChange={setFilter}
            options={(Object.keys(FILTERS) as Filter[]).map((value) => ({
              value,
              label: t(`attendance.filters.${value}`),
            }))}
          />
          <Button
            size="sm"
            disabled={!submitted.length || approve.isPending}
            onClick={() => approve.mutate(submitted.map((s) => s.id))}
          >
            <CheckCheck /> {t('attendance.approveAll', { count: submitted.length })}
          </Button>
        </div>
        <div className="border-t">
          {attendance.isError ? (
            <WidgetError onRetry={() => void attendance.refetch()} />
          ) : loading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : visible.length ? (
            <TimesheetTable
              weekStart={weekStart!}
              timesheets={visible}
              todayIndex={week === 0 ? -daysUntil(weekStart!) : -1}
              approving={approve.isPending}
              onApprove={(ids) => approve.mutate(ids)}
            />
          ) : (
            <EmptyState
              variant="plain"
              icon={CheckCheck}
              title={t('attendance.empty')}
              className="py-12"
            />
          )}
        </div>
      </SectionCard>
    </Page>
  );
}
