import {
  AlarmClock,
  BookOpenCheck,
  ChevronRight,
  GraduationCap,
  Hourglass,
  Star,
} from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { Tag } from '@/shared/components/display/tag';
import { Progress } from '@/shared/ui/progress';
import { Skeleton } from '@/shared/ui/skeleton';

import { trainingQuery, useTraining } from '../api/people-ops-api';
import { AssignTrainingDialog } from '../components/assign-training-dialog';
import { AssignmentsTable } from '../components/assignments-table';
import { CourseSheet } from '../components/course-sheet';
import { DepartmentLabel, DotLabel } from '../components/hr-parts';
import { WidgetError } from '../components/widget-error';
import { percent } from '../lib/format';
import { groupBy } from '../lib/group-by';
import { COURSE_COLOR, type Assignment, type Course } from '../model/training';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(trainingQuery());
    return null;
  };

const countBy = (list: Assignment[], status: Assignment['status']) =>
  list.filter((a) => a.status === status).length;

function CourseCard({
  course,
  assignments,
  onOpen,
}: {
  course: Course;
  assignments: Assignment[];
  onOpen: () => void;
}) {
  const { t } = useTranslation('hr');
  const done = percent(countBy(assignments, 'completed'), assignments.length);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full w-full flex-col gap-4 rounded-xl border bg-card p-5 text-left shadow-xs transition-shadow hover:shadow-md"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0 space-y-1">
          <DotLabel color={COURSE_COLOR[course.category]} className="text-xs text-muted-foreground">
            {t(`training.categories.${course.category}`)}
          </DotLabel>
          <span className="block font-semibold group-hover:underline">{course.title}</span>
          <span className="block text-xs text-muted-foreground">
            {t(`training.formats.${course.format}`)} ·{' '}
            {t('training.hours', { count: course.hours })}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </span>
      <span className="space-y-1.5">
        <span className="flex justify-between text-xs text-muted-foreground">
          <span>{t('training.learners', { count: assignments.length })}</span>
          <span className="tabular-nums">{done}%</span>
        </span>
        <Progress value={done} className="h-1.5" aria-hidden />
      </span>
      <span className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1 text-muted-foreground tabular-nums">
          <Star className="size-3.5 fill-warning text-warning" aria-hidden /> {course.rating}
        </span>
        {course.required && <Tag tone="warning">{t('training.required')}</Tag>}
      </span>
    </button>
  );
}

function ComplianceList({ assignments }: { assignments: Assignment[] }) {
  const { t } = useTranslation('hr');
  const departments = groupBy(assignments, (a) => a.department);
  const rows = [...departments]
    .map(([department, list]) => ({
      department,
      done: percent(countBy(list, 'completed'), list.length),
      overdue: countBy(list, 'overdue'),
    }))
    .sort((a, b) => a.done - b.done);

  return (
    <ul className="space-y-4">
      {rows.map(({ department, done, overdue }) => (
        <li key={department} className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-sm">
            <DepartmentLabel department={department} />
            <span className="flex items-center gap-2 tabular-nums">
              {overdue > 0 && (
                <span className="text-xs text-destructive">
                  {t('training.overdueCount', { count: overdue })}
                </span>
              )}
              <span className="font-medium">{done}%</span>
            </span>
          </div>
          <Progress value={done} className="h-1.5" aria-hidden />
        </li>
      ))}
    </ul>
  );
}

export default function TrainingPage() {
  const { t } = useTranslation('hr');
  const training = useTraining();
  const [openId, setOpenId] = useState<string>();

  const courses = training.data?.courses ?? [];
  const assignments = training.data?.assignments ?? [];
  const byCourse = groupBy(assignments, (a) => a.courseId);
  const required = new Set(courses.filter((c) => c.required).map((c) => c.id));
  const compliance = assignments.filter((a) => required.has(a.courseId));

  const stats = [
    { key: 'courses', icon: GraduationCap, color: 'var(--primary)', value: courses.length },
    {
      key: 'inProgress',
      icon: Hourglass,
      color: 'var(--info)',
      value: countBy(assignments, 'inProgress'),
    },
    {
      key: 'compliance',
      icon: BookOpenCheck,
      color: 'var(--success)',
      value: `${percent(countBy(compliance, 'completed'), compliance.length)}%`,
    },
    {
      key: 'overdue',
      icon: AlarmClock,
      color: 'var(--destructive)',
      value: countBy(assignments, 'overdue'),
    },
  ] as const;

  return (
    <Page
      width="full"
      title={t('training.title')}
      description={t('training.description')}
      actions={<AssignTrainingDialog courses={courses} />}
    >
      <div className="grid grid-cols-2 gap-4 md:gap-6 xl:grid-cols-4">
        {stats.map(({ key, ...stat }) => (
          <StatCard
            key={key}
            {...stat}
            label={t(`training.stats.${key}`)}
            loading={!training.data}
          />
        ))}
      </div>

      {training.isError ? (
        <WidgetError onRetry={() => void training.refetch()} />
      ) : !training.data ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : (
        <>
          <div className="grid items-start gap-4 md:gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <ul
              className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3"
              aria-label={t('training.catalog')}
            >
              {courses.map((course) => (
                <li key={course.id}>
                  <CourseCard
                    course={course}
                    assignments={byCourse.get(course.id) ?? []}
                    onOpen={() => setOpenId(course.id)}
                  />
                </li>
              ))}
            </ul>
            <SectionCard
              title={t('training.complianceTitle')}
              description={t('training.complianceHint')}
            >
              <ComplianceList assignments={compliance} />
            </SectionCard>
          </div>
          <AssignmentsTable courses={courses} assignments={assignments} />
        </>
      )}

      <CourseSheet
        course={courses.find((c) => c.id === openId)}
        assignments={assignments}
        onOpenChange={(open) => !open && setOpenId(undefined)}
      />
    </Page>
  );
}
