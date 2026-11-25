import { ArrowLeft, Inbox } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useParams } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { EmptyState } from '@/shared/components/display/empty-state';
import { Tag } from '@/shared/components/display/tag';
import { UserCell } from '@/shared/components/display/user-cell';
import { formatRelative } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { assignmentQuery, useAssignment } from '../api/academy-api';
import { AssignmentStatusTag } from '../components/assignment-status-tag';
import { GradingPanel } from '../components/grading-panel';
import { QueryState } from '../components/query-state';
import { longDate, percent } from '../lib/format';
import type { AssignmentDetail } from '../model/academy';
import { academyRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(assignmentQuery(params.assignmentId!));
    return null;
  };

function Grading({ assignment }: { assignment: AssignmentDetail }) {
  const { t } = useTranslation('academy');
  const { submissions, points } = assignment;
  const [selectedId, setSelectedId] = useState(
    () => (submissions.find((s) => s.score === null) ?? submissions[0])?.id,
  );
  const index = submissions.findIndex((s) => s.id === selectedId);
  const selected = submissions[index];
  const next = [...submissions.slice(index + 1), ...submissions.slice(0, index)].find(
    (s) => s.score === null,
  );

  return (
    <div className="space-y-6">
      <SectionCard
        title={t('grading.brief')}
        description={t('grading.meta', { date: longDate(assignment.dueAt), points })}
        action={<AssignmentStatusTag assignment={assignment} />}
      >
        <p className="max-w-3xl text-sm leading-relaxed">{assignment.brief}</p>
        <StatStrip
          className="mt-4 border-t pt-2"
          items={[
            {
              key: 'submitted',
              label: t('grading.stats.submitted'),
              value: `${assignment.submitted}/${assignment.enrolled}`,
            },
            {
              key: 'graded',
              label: t('grading.stats.graded'),
              value: `${assignment.graded}/${assignment.submitted}`,
            },
            {
              key: 'average',
              label: t('grading.stats.average'),
              value: percent(assignment.averageScore),
            },
            {
              key: 'late',
              label: t('grading.stats.late'),
              value: submissions.filter((s) => s.late).length,
            },
          ]}
        />
      </SectionCard>

      {selected ? (
        <div className="grid items-start gap-6 xl:grid-cols-[1fr_26rem]">
          <SectionCard flush title={t('grading.submissions')}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">{t('grading.columns.student')}</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    {t('grading.columns.submitted')}
                  </TableHead>
                  <TableHead className="pr-6 text-right">{t('grading.columns.score')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((s) => (
                  <TableRow key={s.id} data-state={s.id === selected.id ? 'selected' : undefined}>
                    <TableCell className="pl-6">
                      <button
                        type="button"
                        className="rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        aria-current={s.id === selected.id}
                        onClick={() => setSelectedId(s.id)}
                      >
                        <UserCell name={s.studentName} secondary={s.studentEmail} />
                      </button>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatRelative(s.submittedAt)}
                      {s.late && (
                        <Tag tone="warning" size="sm" className="ml-2">
                          {t('grading.late')}
                        </Tag>
                      )}
                    </TableCell>
                    <TableCell className="pr-6 text-right tabular-nums">
                      {s.score === null ? (
                        <Tag size="sm">{t('grading.pending')}</Tag>
                      ) : (
                        `${s.score}/${points}`
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
          <GradingPanel
            key={selected.id}
            submission={selected}
            points={points}
            onNext={next && (() => setSelectedId(next.id))}
          />
        </div>
      ) : (
        <EmptyState
          icon={Inbox}
          title={t('grading.empty.title')}
          description={t('grading.empty.description')}
        />
      )}
    </div>
  );
}

/** Grade one assignment: brief, submissions, and a score + feedback panel. */
export default function AssignmentPage() {
  const { t } = useTranslation('academy');
  const { assignmentId } = useParams();
  const query = useAssignment(assignmentId!);

  return (
    <Page
      width="full"
      title={query.data?.title ?? t('assignments.title')}
      description={query.data?.courseTitle}
      actions={
        <Button variant="outline" asChild>
          <Link to={academyRoutes.assignments.href()}>
            <ArrowLeft /> {t('grading.back')}
          </Link>
        </Button>
      }
    >
      <QueryState
        query={query}
        skeleton={
          <div className="space-y-6">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-[28rem] rounded-xl" />
          </div>
        }
      >
        {(assignment) => <Grading assignment={assignment} />}
      </QueryState>
    </Page>
  );
}
