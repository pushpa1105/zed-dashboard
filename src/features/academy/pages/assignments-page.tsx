import { ClipboardList } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { EmptyState } from '@/shared/components/display/empty-state';
import { formatRelative } from '@/shared/lib/format';
import { Progress } from '@/shared/ui/progress';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { assignmentsQuery, useAssignments } from '../api/academy-api';
import { AssignmentStatusTag } from '../components/assignment-status-tag';
import { FilterTabs } from '../components/filter-tabs';
import { QueryState } from '../components/query-state';
import { longDate, percent } from '../lib/format';
import {
  ASSIGNMENT_STATUSES,
  assignmentStatus,
  type Assignment,
  type AssignmentStatus,
} from '../model/academy';
import { academyRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(assignmentsQuery());
    return null;
  };

function AssignmentsTable({ rows }: { rows: Assignment[] }) {
  const { t } = useTranslation('academy');
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-6">{t('assignments.columns.assignment')}</TableHead>
          <TableHead className="hidden md:table-cell">{t('assignments.columns.due')}</TableHead>
          <TableHead className="hidden w-48 sm:table-cell">
            {t('assignments.columns.submissions')}
          </TableHead>
          <TableHead className="hidden text-right lg:table-cell">
            {t('assignments.columns.graded')}
          </TableHead>
          <TableHead className="hidden text-right lg:table-cell">
            {t('assignments.columns.average')}
          </TableHead>
          <TableHead className="pr-6">{t('assignments.columns.status')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((a) => (
          <TableRow key={a.id}>
            <TableCell className="max-w-72 pl-6">
              <Link
                to={academyRoutes.assignment.href({ assignmentId: a.id })}
                className="block truncate font-medium hover:underline"
              >
                {a.title}
              </Link>
              <p className="truncate text-xs text-muted-foreground">{a.courseTitle}</p>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <p>{longDate(a.dueAt)}</p>
              <p className="text-xs text-muted-foreground">{formatRelative(a.dueAt)}</p>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <span className="flex items-center gap-2">
                <Progress value={(a.submitted / a.enrolled) * 100} className="h-1.5 flex-1" />
                <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                  {a.submitted}/{a.enrolled}
                </span>
              </span>
            </TableCell>
            <TableCell className="hidden text-right tabular-nums lg:table-cell">
              {a.graded}/{a.submitted}
            </TableCell>
            <TableCell className="hidden text-right tabular-nums lg:table-cell">
              {percent(a.averageScore)}
            </TableCell>
            <TableCell className="pr-6">
              <AssignmentStatusTag assignment={a} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Instructor view of every assignment: what is due, what came in, what still needs a grade. */
export default function AssignmentsPage() {
  const { t } = useTranslation('academy');
  const query = useAssignments();
  const [filter, setFilter] = useState<'all' | AssignmentStatus>('all');

  return (
    <Page width="full" title={t('assignments.title')} description={t('assignments.description')}>
      <QueryState
        query={query}
        skeleton={
          <div className="space-y-6">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-[28rem] rounded-xl" />
          </div>
        }
      >
        {(assignments) => {
          const count = (status: AssignmentStatus) =>
            assignments.filter((a) => assignmentStatus(a) === status).length;
          const rows = assignments.filter(
            (a) => filter === 'all' || assignmentStatus(a) === filter,
          );
          const scores = assignments.flatMap((a) => a.averageScore ?? []);
          return (
            <div className="space-y-6">
              <SectionCard>
                <StatStrip
                  items={[
                    { key: 'open', label: t('assignments.stats.open'), value: count('open') },
                    {
                      key: 'toGrade',
                      label: t('assignments.stats.toGrade'),
                      value: assignments.reduce((s, a) => s + a.submitted - a.graded, 0),
                    },
                    {
                      key: 'average',
                      label: t('assignments.stats.average'),
                      value: percent(
                        scores.length
                          ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
                          : null,
                      ),
                    },
                  ]}
                />
              </SectionCard>
              <SectionCard
                flush
                title={t('assignments.table.title')}
                description={t('assignments.table.count', { count: rows.length })}
                action={
                  <FilterTabs
                    label={t('assignments.table.filter')}
                    value={filter}
                    onChange={setFilter}
                    tabs={[
                      {
                        value: 'all',
                        label: t('assignments.status.all'),
                        count: assignments.length,
                      },
                      ...ASSIGNMENT_STATUSES.map((s) => ({
                        value: s,
                        label: t(`assignments.status.${s}`),
                        count: count(s),
                      })),
                    ]}
                  />
                }
              >
                {rows.length ? (
                  <AssignmentsTable rows={rows} />
                ) : (
                  <EmptyState
                    variant="plain"
                    icon={ClipboardList}
                    title={t('assignments.empty.title')}
                    description={t('assignments.empty.description')}
                  />
                )}
              </SectionCard>
            </div>
          );
        }}
      </QueryState>
    </Page>
  );
}
