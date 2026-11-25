import { ArrowLeft, Award, Mail } from 'lucide-react';
import type { ReactNode } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useParams } from '@/core/router/router';
import { Heatmap } from '@/shared/components/charts/heatmap';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { EmptyState } from '@/shared/components/display/empty-state';
import { Tag } from '@/shared/components/display/tag';
import { formatRelative } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Progress } from '@/shared/ui/progress';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { studentQuery, useStudentProfile } from '../api/academy-api';
import { CourseCover } from '../components/course-cover';
import { QueryState } from '../components/query-state';
import { StudentStatusBadge } from '../components/student-status-badge';
import { longDate, minutes } from '../lib/format';
import type { StudentProfile } from '../model/academy';
import { academyRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(studentQuery(params.studentId!));
    return null;
  };

function Courses({ enrollments }: { enrollments: StudentProfile['enrollments'] }) {
  const { t } = useTranslation('academy');
  return (
    <SectionCard title={t('student.courses')}>
      <ul className="space-y-4">
        {enrollments.map((e) => (
          <li key={e.courseId} className="flex items-center gap-4">
            <CourseCover
              color={e.color}
              category={e.category}
              size="sm"
              className="size-12 shrink-0 rounded-lg"
            />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Link
                  to={academyRoutes.course.href({ courseId: e.courseId })}
                  className="truncate text-sm font-medium hover:underline"
                >
                  {e.title}
                </Link>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {t('student.active', { when: formatRelative(e.lastActive) })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={e.progress} className="h-1.5 flex-1" />
                <span className="w-24 text-right text-xs text-muted-foreground tabular-nums">
                  {e.progress}% · {t('student.grade', { grade: e.grade })}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

function Grades({ grades }: { grades: StudentProfile['grades'] }) {
  const { t } = useTranslation('academy');
  return (
    <SectionCard flush title={t('student.grades.title')}>
      {grades.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">{t('assignments.columns.assignment')}</TableHead>
              <TableHead className="hidden sm:table-cell">
                {t('grading.columns.submitted')}
              </TableHead>
              <TableHead className="pr-6 text-right">{t('grading.columns.score')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grades.map((g) => (
              <TableRow key={g.assignmentId}>
                <TableCell className="max-w-72 pl-6">
                  <Link
                    to={academyRoutes.assignment.href({ assignmentId: g.assignmentId })}
                    className="block truncate font-medium hover:underline"
                  >
                    {g.title}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{g.courseTitle}</p>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {longDate(g.submittedAt)}
                </TableCell>
                <TableCell className="pr-6 text-right tabular-nums">
                  {g.score === null ? (
                    <Tag size="sm">{t('grading.pending')}</Tag>
                  ) : (
                    `${g.score}/${g.points}`
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="px-6 pb-6 text-sm text-muted-foreground">{t('student.grades.empty')}</p>
      )}
    </SectionCard>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate">{children}</dd>
    </div>
  );
}

function Profile({ profile }: { profile: StudentProfile }) {
  const { t, i18n } = useTranslation('academy');
  const { student, enrollments } = profile;
  // 2024-01-01 was a Monday.
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 1 + i).toLocaleDateString(i18n.language, { weekday: 'short' }),
  );

  return (
    <div className="space-y-6">
      <SectionCard>
        <StatStrip
          items={[
            { key: 'courses', label: t('student.stats.courses'), value: enrollments.length },
            {
              key: 'grade',
              label: t('student.stats.grade'),
              value: Math.round(enrollments.reduce((s, e) => s + e.grade, 0) / enrollments.length),
            },
            {
              key: 'streak',
              label: t('student.stats.streak'),
              value: t('student.days', { count: profile.streakDays }),
              hint: t('student.longest', { count: profile.longestStreak }),
            },
            {
              key: 'time',
              label: t('student.stats.time'),
              value: minutes(profile.totalMinutes),
              hint: t('home.activity.description'),
            },
          ]}
        />
      </SectionCard>
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          <Courses enrollments={enrollments} />
          <SectionCard
            title={t('home.activity.title')}
            description={t('home.activity.description')}
          >
            <Heatmap
              rows={weekdays}
              columns={Array.from({ length: 12 }, (_, i) =>
                i === 11 ? t('home.activity.thisWeek') : `W${i + 1}`,
              )}
              values={profile.activity}
              valueFormatter={(v) => minutes(v)}
            />
          </SectionCard>
          <Grades grades={profile.grades} />
        </div>
        <div className="space-y-6">
          <SectionCard title={t('student.about')}>
            <dl className="space-y-3 text-sm">
              <Fact label={t('students.columns.status')}>
                <StudentStatusBadge status={student.status} />
              </Fact>
              <Fact label={t('student.email')}>{student.email}</Fact>
              <Fact label={t('student.joined')}>{longDate(profile.joinedAt)}</Fact>
              <Fact label={t('students.columns.lastActive')}>
                {formatRelative(student.lastActive)}
              </Fact>
            </dl>
          </SectionCard>
          <SectionCard title={t('nav.certificates')}>
            {profile.certificates.length ? (
              <ul className="space-y-4">
                {profile.certificates.map((c) => (
                  <li key={c.id} className="flex gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning">
                      <Award className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{c.courseTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {longDate(c.issuedAt)} · {t('student.grade', { grade: c.grade })}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">{c.credentialId}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState variant="inline" icon={Award} title={t('student.noCertificates')} />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

/** One learner: courses, grades, learning streak and certificates. */
export default function StudentPage() {
  const { t } = useTranslation('academy');
  const { studentId } = useParams();
  const query = useStudentProfile(studentId!);
  const student = query.data?.student;

  return (
    <Page
      width="full"
      title={student?.name ?? t('students.title')}
      description={student?.courseTitle}
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to={academyRoutes.students.href()}>
              <ArrowLeft /> {t('student.back')}
            </Link>
          </Button>
          {student && (
            <Button asChild>
              <a href={`mailto:${student.email}`}>
                <Mail /> {t('student.message')}
              </a>
            </Button>
          )}
        </>
      }
    >
      <QueryState
        query={query}
        skeleton={
          <div className="space-y-6">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-[32rem] rounded-xl" />
          </div>
        }
      >
        {(profile) => <Profile profile={profile} />}
      </QueryState>
    </Page>
  );
}
