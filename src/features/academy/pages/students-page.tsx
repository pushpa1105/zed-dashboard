import {
  AlertTriangle,
  CheckCircle2,
  Mail,
  TrendingUp,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { Link } from '@/core/router/router';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { UserCell } from '@/shared/components/display/user-cell';
import { SearchInput } from '@/shared/components/forms/search-input';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Progress } from '@/shared/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { studentsQuery, useStudents } from '../api/academy-api';
import { QueryError } from '../components/query-error';
import { StudentStatusBadge } from '../components/student-status-badge';
import { STUDENT_STATUSES, type Student } from '../model/academy';
import { academyRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(studentsQuery());
    return null;
  };

type StatusFilter = 'all' | Student['status'];
const STATUS_ICON: Record<Student['status'], LucideIcon> = {
  'on-track': TrendingUp,
  'at-risk': AlertTriangle,
  completed: CheckCircle2,
};

const daysAgo = (iso: string) => Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);

/** Instructor view of enrolled students: who is on track, who needs a nudge. */
export default function StudentsPage() {
  const { t } = useTranslation('academy');
  const query = useStudents();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [course, setCourse] = useState('all');
  const [search, setSearch] = useState('');
  const students = query.data;

  const courses = useMemo(
    () => [...new Map((students ?? []).map((s) => [s.courseId, s.courseTitle])).entries()],
    [students],
  );
  const rows = (students ?? []).filter((s) => {
    const q = search.trim().toLowerCase();
    return (
      (status === 'all' || s.status === status) &&
      (course === 'all' || s.courseId === course) &&
      (!q || s.name.toLowerCase().includes(q) || s.email.includes(q))
    );
  });
  const distribution = ['<60', '60–69', '70–79', '80–89', '90+'].map((band, i) => ({
    band,
    students: (students ?? []).filter((s) => {
      const g = s.grade;
      return i === 0 ? g < 60 : i === 4 ? g >= 90 : g >= 50 + i * 10 && g < 60 + i * 10;
    }).length,
  }));
  const atRisk = (students ?? []).filter((s) => s.status === 'at-risk');

  return (
    <Page width="full" title={t('students.title')} description={t('students.description')}>
      {query.isError && !students ? (
        <QueryError onRetry={() => void query.refetch()} />
      ) : !students ? (
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[30rem] rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(['all', ...STUDENT_STATUSES] as const).map((value) => {
              const Icon = value === 'all' ? UsersRound : STATUS_ICON[value];
              const count =
                value === 'all'
                  ? students.length
                  : students.filter((s) => s.status === value).length;
              const active = status === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatus(value)}
                  className={cn(
                    'flex items-center gap-4 rounded-xl border bg-card p-5 text-left shadow-xs transition-colors hover:border-primary/40',
                    active && 'border-primary ring-2 ring-primary/15',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground',
                      active && 'bg-primary/10 text-primary',
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm text-muted-foreground">
                      {t(`students.status.${value}`)}
                    </span>
                    <span className="block text-2xl font-semibold tabular-nums">{count}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="grid items-start gap-6 xl:grid-cols-[1fr_20rem]">
            <SectionCard
              flush
              title={t('students.table.title')}
              description={t('students.table.count', { count: rows.length })}
              action={
                <div className="flex flex-wrap items-center gap-2">
                  <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder={t('students.search')}
                    containerClassName="w-52"
                  />
                  <Select value={course} onValueChange={setCourse}>
                    <SelectTrigger className="w-52" aria-label={t('students.course')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="all">{t('students.allCourses')}</SelectItem>
                      {courses.map(([id, title]) => (
                        <SelectItem key={id} value={id}>
                          {title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              }
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">{t('students.columns.student')}</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      {t('students.columns.course')}
                    </TableHead>
                    <TableHead className="w-44">{t('students.columns.progress')}</TableHead>
                    <TableHead className="text-right">{t('students.columns.grade')}</TableHead>
                    <TableHead className="hidden md:table-cell">
                      {t('students.columns.lastActive')}
                    </TableHead>
                    <TableHead className="pr-6">{t('students.columns.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="pl-6">
                        <Link
                          to={academyRoutes.student.href({ studentId: s.id })}
                          className="block rounded-md hover:[&_p:first-child]:underline"
                        >
                          <UserCell name={s.name} secondary={s.email} />
                        </Link>
                      </TableCell>
                      <TableCell className="hidden max-w-56 truncate text-muted-foreground lg:table-cell">
                        {s.courseTitle}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <Progress value={s.progress} className="h-1.5 flex-1" />
                          <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
                            {s.progress}%
                          </span>
                        </span>
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-medium tabular-nums',
                          s.grade < 62 && 'text-destructive',
                        )}
                      >
                        {s.grade}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {t('students.daysAgo', { count: daysAgo(s.lastActive) })}
                      </TableCell>
                      <TableCell className="pr-6">
                        <StudentStatusBadge status={s.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
            <div className="space-y-6">
              <SectionCard
                title={t('students.grades.title')}
                description={t('students.grades.description')}
              >
                <BarChart
                  data={distribution}
                  xKey="band"
                  series={[{ key: 'students', label: t('students.grades.students') }]}
                  highlight={4}
                  className="h-52"
                  barSize={26}
                />
              </SectionCard>
              <SectionCard
                title={t('students.nudge.title')}
                description={t('students.nudge.description', { count: atRisk.length })}
              >
                <ul className="space-y-3">
                  {atRisk.slice(0, 4).map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2">
                      <UserCell
                        name={s.name}
                        secondary={t('students.daysAgo', { count: daysAgo(s.lastActive) })}
                      />
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  disabled={!atRisk.length}
                  onClick={() => notify.success(t('students.nudge.sent', { count: atRisk.length }))}
                >
                  <Mail /> {t('students.nudge.action')}
                </Button>
              </SectionCard>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
