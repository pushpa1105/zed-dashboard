import { PlayCircle } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { UserCell } from '@/shared/components/display/user-cell';
import { formatRelative } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Progress } from '@/shared/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { longDate, minutes, percent, rate, time } from '../lib/format';
import { attendanceRate, type LiveSession } from '../model/teaching';

import { LiveAction } from './live-action';

/** Seats taken before a session, share of registrants who came after it. */
const fill = (s: LiveSession) =>
  s.attended === null
    ? { value: rate(s.registered, s.capacity), label: `${s.registered}/${s.capacity}` }
    : { value: attendanceRate(s) ?? 0, label: percent(attendanceRate(s)) };

/** Sessions with date, host, seats (or attendance once past) and the next action. */
export function LiveSessionsTable({
  rows,
  past,
  onOpen,
}: {
  rows: LiveSession[];
  past: boolean;
  onOpen: (session: LiveSession) => void;
}) {
  const { t } = useTranslation('academy');
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-6">{t('live.columns.session')}</TableHead>
          <TableHead className="hidden md:table-cell">{t('live.columns.date')}</TableHead>
          <TableHead className="hidden lg:table-cell">{t('live.columns.host')}</TableHead>
          <TableHead className="hidden w-40 sm:table-cell">
            {t(past ? 'live.columns.attendance' : 'live.columns.seats')}
          </TableHead>
          <TableHead className="pr-6 text-right">
            <span className="sr-only">{t('live.columns.action')}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="max-w-72 pl-6">
              <button
                type="button"
                onClick={() => onOpen(s)}
                className="flex max-w-full items-center gap-2 text-left font-medium hover:underline"
              >
                <span className="size-2 shrink-0 rounded-full" style={{ background: s.color }} />
                <span className="truncate">{s.title}</span>
              </button>
              <p className="truncate pl-4 text-xs text-muted-foreground">{s.courseTitle}</p>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <p>{longDate(s.startsAt)}</p>
              <p className="text-xs text-muted-foreground">
                {time(s.startsAt)} · {minutes(s.durationMin)} · {formatRelative(s.startsAt)}
              </p>
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <UserCell name={s.host.name} secondary={s.host.title} />
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <span className="flex items-center gap-2">
                <Progress value={fill(s).value} className="h-1.5 flex-1" />
                <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                  {fill(s).label}
                </span>
              </span>
            </TableCell>
            <TableCell className="pr-6 text-right">
              {past ? (
                <Button size="sm" variant="ghost" disabled={!s.recording} onClick={() => onOpen(s)}>
                  <PlayCircle /> {t(s.recording ? 'live.watch' : 'live.noRecordingShort')}
                </Button>
              ) : (
                <LiveAction session={s} />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
