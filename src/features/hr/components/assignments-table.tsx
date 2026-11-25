import { SearchX } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { useEnumParam } from '@/core/router/search-params';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { EmptyState } from '@/shared/components/display/empty-state';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { SearchInput } from '@/shared/components/forms/search-input';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { Pager } from '@/shared/components/pager';
import { cn } from '@/shared/lib/cn';
import { Progress } from '@/shared/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { longDate } from '../lib/format';
import {
  ASSIGNMENT_STATUSES,
  ASSIGNMENT_TONE,
  type Assignment,
  type Course,
} from '../model/training';

import { DepartmentLabel, PersonLink } from './hr-parts';

const FILTERS = ['all', ...ASSIGNMENT_STATUSES] as const;
const PAGE_SIZE = 10;

export function AssignmentsTable({
  courses,
  assignments,
}: {
  courses: Course[];
  assignments: Assignment[];
}) {
  const { t } = useTranslation('hr');
  const [status, setStatus] = useEnumParam('status', FILTERS, 'all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const titles = new Map(courses.map((c) => [c.id, c.title]));

  const needle = query.trim().toLowerCase();
  const rows = assignments
    .filter(
      (a) =>
        (status === 'all' || a.status === status) &&
        `${a.name} ${a.department} ${titles.get(a.courseId)}`.toLowerCase().includes(needle),
    )
    .sort((a, b) => a.due.localeCompare(b.due));
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const filter =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setPage(1);
    };

  return (
    <SectionCard
      flush
      title={t('training.assignments')}
      description={t('training.assignmentsHint', { count: rows.length })}
    >
      <div className="flex flex-col gap-3 px-6 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput
          value={query}
          onChange={filter(setQuery)}
          placeholder={t('training.search')}
          aria-label={t('training.search')}
          containerClassName="lg:max-w-xs"
        />
        <div className="scrollbar-none overflow-x-auto">
          <SegmentedControl
            size="sm"
            value={status}
            onChange={filter(setStatus)}
            options={FILTERS.map((value) => ({ value, label: t(`training.status.${value}`) }))}
          />
        </div>
      </div>
      {rows.length ? (
        <>
          <Table className="min-w-[48rem] border-t">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">{t('training.columns.employee')}</TableHead>
                <TableHead>{t('training.columns.course')}</TableHead>
                <TableHead>{t('training.columns.department')}</TableHead>
                <TableHead>{t('training.columns.due')}</TableHead>
                <TableHead className="w-40">{t('training.columns.progress')}</TableHead>
                <TableHead className="pr-6">{t('training.columns.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE).map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="pl-6">
                    <PersonLink personId={a.personId} name={a.name} />
                  </TableCell>
                  <TableCell className="max-w-56 truncate">{titles.get(a.courseId)}</TableCell>
                  <TableCell>
                    <DepartmentLabel department={a.department} />
                  </TableCell>
                  <TableCell
                    className={cn(
                      'tabular-nums',
                      a.status === 'overdue' ? 'text-destructive' : 'text-muted-foreground',
                    )}
                  >
                    {longDate(a.due)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={a.progress} className="h-1.5" aria-hidden />
                      <span className="w-9 text-right text-xs tabular-nums">{a.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-6">
                    <StatusBadge
                      status={a.status}
                      tone={ASSIGNMENT_TONE[a.status]}
                      label={t(`training.status.${a.status}`)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="border-t px-6 py-3">
              <Pager
                page={current}
                totalPages={totalPages}
                onPageChange={setPage}
                labels={{
                  previous: t('common.previous'),
                  next: t('common.next'),
                  status: t('common.pageOf', { page: current, total: totalPages }),
                }}
              />
            </div>
          )}
        </>
      ) : (
        <EmptyState
          variant="plain"
          icon={SearchX}
          title={t('training.noMatches')}
          className="border-t py-12"
        />
      )}
    </SectionCard>
  );
}
