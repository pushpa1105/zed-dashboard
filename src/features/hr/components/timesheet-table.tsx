import { Check } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { hours, timeOfDay } from '../lib/format';
import { DAILY_LIMIT, weekTotal, type Timesheet } from '../model/workforce';
import { hrRoutes } from '../routes';

const DAY = 86_400_000;

const CLOCK_TONE = { in: 'success', break: 'warning', out: 'neutral', absent: 'danger' } as const;
const SHEET_TONE = { draft: 'neutral', submitted: 'warning', approved: 'success' } as const;

function ClockStatus({ clock }: { clock: NonNullable<Timesheet['clock']> }) {
  const { t } = useTranslation('hr');
  const label = t(`attendance.clock.${clock.status}`);
  return (
    <StatusBadge
      variant="dot"
      status={clock.status}
      tone={CLOCK_TONE[clock.status]}
      label={clock.since ? `${label} · ${timeOfDay(clock.since)}` : label}
    />
  );
}

type TimesheetTableProps = {
  weekStart: string;
  timesheets: Timesheet[];
  /** Column to highlight, 0 = Monday; -1 when the week isn't the current one. */
  todayIndex: number;
  approving: boolean;
  onApprove: (ids: string[]) => void;
};

export function TimesheetTable({
  weekStart,
  timesheets,
  todayIndex,
  approving,
  onApprove,
}: TimesheetTableProps) {
  const { t, i18n } = useTranslation('hr');
  const days = Array.from({ length: 7 }, (_, i) => new Date(Date.parse(weekStart) + i * DAY));
  const dayCell = (i: number) =>
    cn(
      'w-14 text-center tabular-nums',
      i >= 5 && 'bg-muted/40',
      i === todayIndex && 'bg-primary/5',
    );

  return (
    <Table className="min-w-[60rem]">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-6">{t('attendance.columns.employee')}</TableHead>
          {days.map((d, i) => (
            <TableHead key={i} className={cn(dayCell(i), i === todayIndex && 'text-primary')}>
              <span className="block text-xs">
                {d.toLocaleDateString(i18n.language, { weekday: 'short', timeZone: 'UTC' })}
              </span>
              <span className="block text-[0.6875rem] font-normal">{d.getUTCDate()}</span>
            </TableHead>
          ))}
          <TableHead className="text-right">{t('attendance.columns.total')}</TableHead>
          <TableHead>{t('attendance.columns.status')}</TableHead>
          <TableHead className="pr-6 text-right">
            <span className="sr-only">{t('attendance.columns.actions')}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {timesheets.map((sheet) => {
          const total = weekTotal(sheet);
          const extra = total - sheet.scheduled;
          return (
            <TableRow key={sheet.id}>
              <TableCell className="pl-6">
                <div className="flex items-center gap-3">
                  <InitialsAvatar name={sheet.name} size="sm" />
                  <div className="min-w-0 space-y-0.5">
                    <Link
                      to={hrRoutes.person.href({ personId: sheet.personId })}
                      className="block truncate font-medium hover:underline"
                    >
                      {sheet.name}
                    </Link>
                    {sheet.clock ? (
                      <ClockStatus clock={sheet.clock} />
                    ) : (
                      <p className="truncate text-xs text-muted-foreground">{sheet.title}</p>
                    )}
                  </div>
                </div>
              </TableCell>
              {sheet.hours.map((h, i) => (
                <TableCell
                  key={i}
                  className={cn(
                    dayCell(i),
                    !h && 'text-muted-foreground',
                    h > DAILY_LIMIT && 'bg-warning/15 font-semibold',
                  )}
                  title={h > DAILY_LIMIT ? t('attendance.longDay') : undefined}
                >
                  {hours(h)}
                </TableCell>
              ))}
              <TableCell className="text-right tabular-nums">
                <span className="font-semibold">{hours(total)}</span>
                {extra > 0 && (
                  <span className="ml-1.5 rounded-full bg-warning/15 px-1.5 py-0.5 text-xs font-medium">
                    {t('attendance.overtimeHours', { hours: hours(extra) })}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <StatusBadge
                  status={sheet.status}
                  tone={SHEET_TONE[sheet.status]}
                  label={t(`attendance.status.${sheet.status}`)}
                />
              </TableCell>
              <TableCell className="pr-6 text-right">
                {sheet.status === 'submitted' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={approving}
                    aria-label={t('attendance.approveFor', { name: sheet.name })}
                    onClick={() => onApprove([sheet.id])}
                  >
                    <Check /> {t('attendance.approve')}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
