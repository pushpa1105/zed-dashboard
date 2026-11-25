import { ArrowRight, CalendarDays, MapPin, Users } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link } from '@/core/router/router';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { Skeleton } from '@/shared/ui/skeleton';

import { jobsQuery, useJobs } from '../api/hr-api';
import { DepartmentLabel } from '../components/hr-parts';
import { NewJobDialog } from '../components/new-job-dialog';
import { WidgetError } from '../components/widget-error';
import { shortDate } from '../lib/format';
import { departmentColor } from '../model/hr';
import { hrRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(jobsQuery());
    return null;
  };

export default function RecruitmentPage() {
  const { t } = useTranslation('hr');
  const jobs = useJobs();
  const totalApplicants = jobs.data?.reduce((s, j) => s + j.applicants, 0) ?? 0;
  const totalInterview = jobs.data?.reduce((s, j) => s + j.inInterview, 0) ?? 0;

  return (
    <Page
      width="full"
      title={t('recruitment.title')}
      description={t('recruitment.description')}
      actions={<NewJobDialog />}
    >
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border bg-card px-6 py-4 shadow-xs sm:grid-cols-3 lg:grid-cols-5 lg:divide-x">
        {[
          {
            key: 'roles',
            label: t('nav.openRoles'),
            value: jobs.data?.filter((j) => j.status === 'open').length ?? '—',
          },
          { key: 'applicants', label: t('recruitment.applicants'), value: totalApplicants },
          { key: 'interview', label: t('recruitment.inInterview'), value: totalInterview },
          {
            key: 'tth',
            label: t('recruitment.timeToHire'),
            value: t('common.days', { count: 27 }),
          },
          { key: 'accept', label: t('recruitment.acceptance'), value: '86%' },
        ].map((stat) => (
          <div key={stat.key} className="lg:pl-6 lg:first:pl-0">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {jobs.isError ? (
        <WidgetError onRetry={() => void jobs.refetch()} />
      ) : !jobs.data ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 md:gap-6">
          {jobs.data.map((job) => {
            const share = job.applicants ? Math.round((job.inInterview / job.applicants) * 100) : 0;
            return (
              <li key={job.id}>
                <Link
                  to={hrRoutes.job.href({ jobId: job.id })}
                  className="group flex h-full flex-col gap-5 rounded-xl border bg-card p-6 shadow-xs transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <span
                      className="mt-1 h-10 w-1 shrink-0 rounded-full"
                      style={{ background: departmentColor(job.department) }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="text-base font-semibold group-hover:underline">{job.title}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <DepartmentLabel department={job.department} />
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="size-3.5" aria-hidden /> {job.location}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="size-3.5" aria-hidden />
                          {t('recruitment.published', { date: shortDate(job.publishedAt) })}
                        </span>
                      </div>
                    </div>
                    <StatusBadge
                      status={job.status}
                      label={t(`recruitment.status.${job.status}`)}
                      tone={job.status === 'open' ? 'success' : 'neutral'}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Users className="size-4" aria-hidden />
                        {job.applicants} {t('recruitment.applicants').toLowerCase()} ·{' '}
                        {job.inInterview} {t('recruitment.inInterview').toLowerCase()}
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-primary">
                        {t('recruitment.viewPipeline')}
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
