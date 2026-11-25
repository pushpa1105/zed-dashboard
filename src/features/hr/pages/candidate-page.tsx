import { ArrowLeft, ArrowRight, Check, GraduationCap } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useParams } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { RatingStars } from '@/shared/components/display/rating-stars';
import { Tag } from '@/shared/components/display/tag';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';

import { candidateQuery, useCandidate, useMoveCandidate } from '../api/hr-api';
import { CandidateScorecards } from '../components/candidate-scorecards';
import { WidgetError } from '../components/widget-error';
import { longDate, money } from '../lib/format';
import {
  CANDIDATE_STAGES,
  STAGE_COLOR,
  type CandidateProfile,
  type CandidateStage,
} from '../model/hr';
import { hrRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(candidateQuery(params.candidateId!));
    return null;
  };

function StagePipeline({ stage }: { stage: CandidateStage }) {
  const { t } = useTranslation('hr');
  const current = CANDIDATE_STAGES.indexOf(stage);
  return (
    <ol className="scrollbar-none flex overflow-x-auto rounded-xl border bg-card p-2 shadow-xs">
      {CANDIDATE_STAGES.map((s, i) => (
        <li
          key={s}
          aria-current={i === current ? 'step' : undefined}
          className={cn(
            'flex min-w-32 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm',
            i === current ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-foreground',
          )}
        >
          <span
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-overlay-foreground"
            style={{ background: i <= current ? STAGE_COLOR[s] : 'var(--muted-foreground)' }}
            aria-hidden
          >
            {i < current ? <Check className="size-3.5" /> : i + 1}
          </span>
          {t(`recruitment.stages.${s}`)}
        </li>
      ))}
    </ol>
  );
}

function StageActions({ candidate }: { candidate: CandidateProfile['candidate'] }) {
  const { t } = useTranslation('hr');
  const move = useMoveCandidate(candidate.jobId);
  const next = CANDIDATE_STAGES[CANDIDATE_STAGES.indexOf(candidate.stage) + 1];
  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={candidate.stage}
        disabled={move.isPending}
        onValueChange={(stage) => move.mutate({ id: candidate.id, stage: stage as CandidateStage })}
      >
        <SelectTrigger className="w-40" aria-label={t('candidate.moveTo')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CANDIDATE_STAGES.map((s) => (
            <SelectItem key={s} value={s}>
              {t(`recruitment.stages.${s}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {next && (
        <Button
          disabled={move.isPending}
          onClick={() => move.mutate({ id: candidate.id, stage: next })}
        >
          {t('candidate.advance', { stage: t(`recruitment.stages.${next}`) })} <ArrowRight />
        </Button>
      )}
    </div>
  );
}

function Resume({ resume }: { resume: CandidateProfile['resume'] }) {
  const { t } = useTranslation('hr');
  return (
    <SectionCard title={t('candidate.resume')} description={resume.headline}>
      <div className="space-y-6">
        <p className="text-sm leading-relaxed">{resume.summary}</p>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{t('candidate.experience')}</h3>
          <ol className="space-y-3 border-l pl-4">
            {resume.experience.map((job) => (
              <li key={job.id} className="relative">
                <span
                  className="absolute top-1.5 -left-[1.3rem] size-2 rounded-full bg-primary"
                  aria-hidden
                />
                <p className="text-sm font-medium">{job.role}</p>
                <p className="text-xs text-muted-foreground">
                  {job.company} · {job.from} – {job.to ?? t('profile.present')}
                </p>
              </li>
            ))}
          </ol>
        </section>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{t('candidate.education')}</h3>
          {resume.education.map((e) => (
            <p key={e.id} className="flex items-center gap-2 text-sm">
              <GraduationCap className="size-4 text-muted-foreground" aria-hidden />
              {e.degree} · <span className="text-muted-foreground">{e.school}</span>
            </p>
          ))}
        </section>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{t('candidate.skills')}</h3>
          <div className="flex flex-wrap gap-1.5">
            {resume.skills.map((skill) => (
              <Tag key={skill} size="sm">
                {skill}
              </Tag>
            ))}
          </div>
        </section>
      </div>
    </SectionCard>
  );
}

export default function CandidatePage() {
  const { t } = useTranslation('hr');
  const { candidateId = '' } = useParams();
  const profile = useCandidate(candidateId);
  const data = profile.data;

  return (
    <Page
      width="wide"
      title={data?.candidate.name ?? '…'}
      description={
        data
          ? t('candidate.appliedFor', { job: data.job.title, department: data.job.department })
          : undefined
      }
      actions={
        data && (
          <Button variant="outline" asChild>
            <Link to={hrRoutes.job.href({ jobId: data.job.id })}>
              <ArrowLeft /> {t('candidate.back')}
            </Link>
          </Button>
        )
      }
    >
      {profile.isError ? (
        <WidgetError onRetry={() => void profile.refetch()} />
      ) : !data ? (
        <div className="space-y-6">
          <Skeleton className="h-14 rounded-xl" />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          <StagePipeline stage={data.candidate.stage} />
          <div className="grid items-start gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="order-2 min-w-0 space-y-4 md:space-y-6 lg:order-1">
              <Resume resume={data.resume} />
              <CandidateScorecards scorecards={data.scorecards} />
            </div>
            <SectionCard className="order-1 lg:order-2">
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <InitialsAvatar name={data.candidate.name} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{data.candidate.name}</p>
                    <RatingStars value={data.candidate.rating} size="sm" />
                  </div>
                </div>
                <StageActions candidate={data.candidate} />
                <dl className="space-y-3 text-sm">
                  {(
                    [
                      { key: 'email', value: data.candidate.email },
                      { key: 'phone', value: data.candidate.phone },
                      { key: 'location', value: data.candidate.location },
                      { key: 'source', value: data.candidate.source },
                      { key: 'applied', value: longDate(data.candidate.appliedAt) },
                      { key: 'salary', value: money(data.candidate.expectedSalary, 0) },
                    ] as const
                  ).map(({ key, value }) => (
                    <div key={key} className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">{t(`candidate.fields.${key}`)}</dt>
                      <dd className="truncate text-right font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </Page>
  );
}
