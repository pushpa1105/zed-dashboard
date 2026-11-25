import { ArrowLeft, Briefcase, Mail, MapPin, MessageSquare, Phone } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useParams } from '@/core/router/router';
import { MeterList } from '@/shared/components/dashboard/meter-list';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { DescriptionList } from '@/shared/components/display/description-list';
import { EmptyState } from '@/shared/components/display/empty-state';
import { FileItem } from '@/shared/components/display/file-item';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { RatingStars } from '@/shared/components/display/rating-stars';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { Tag } from '@/shared/components/display/tag';
import { Timeline } from '@/shared/components/display/timeline';
import { UserCell } from '@/shared/components/display/user-cell';
import {
  VariantTabs,
  VariantTabsContent,
  VariantTabsList,
  VariantTabsTrigger,
} from '@/shared/components/navigation/variant-tabs';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { personQuery, useEmployee } from '../api/hr-api';
import { DepartmentLabel, EmployeeStatus } from '../components/hr-parts';
import { WidgetError } from '../components/widget-error';
import { longDate, money, yearsSince } from '../lib/format';
import { departmentColor, LEAVE_COLOR, type EmployeeProfile } from '../model/hr';
import { hrRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(personQuery(params.personId!));
    return null;
  };

const TIME_OFF_TONE = { pending: 'warning', approved: 'success', declined: 'danger' } as const;
const GOAL_TONE = { onTrack: 'success', atRisk: 'warning', offTrack: 'danger' } as const;

function PersonLink({ person }: { person: EmployeeProfile['reports'][number] }) {
  return (
    <Link
      to={hrRoutes.person.href({ personId: person.id })}
      className="-mx-2 flex items-center gap-3 rounded-lg p-2 hover:bg-muted/60"
    >
      <UserCell name={person.name} secondary={person.title} />
    </Link>
  );
}

export default function PersonPage() {
  const { t } = useTranslation('hr');
  const { personId = '' } = useParams();
  const profile = useEmployee(personId);
  const data = profile.data;
  const person = data?.person;

  if (profile.isError) {
    return (
      <Page width="full" title={t('common.notFound')}>
        <WidgetError onRetry={() => void profile.refetch()} />
      </Page>
    );
  }

  return (
    <Page
      width="full"
      title={person?.name ?? '…'}
      description={person ? `${person.title} · ${person.department}` : undefined}
      actions={
        <Button variant="outline" asChild>
          <Link to={hrRoutes.directory.href()}>
            <ArrowLeft /> {t('nav.directory')}
          </Link>
        </Button>
      }
    >
      <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div
          className="h-24"
          style={{
            background: person
              ? `linear-gradient(120deg, color-mix(in srgb, ${departmentColor(person.department)} 28%, var(--card)), color-mix(in srgb, ${departmentColor(person.department)} 6%, var(--card)))`
              : undefined,
          }}
        />
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end">
          <div className="-mt-10 rounded-full ring-4 ring-card">
            {person ? (
              <InitialsAvatar name={person.name} size="xl" className="size-20 text-xl" />
            ) : (
              <Skeleton className="size-20 rounded-full" />
            )}
          </div>
          {person && (
            <>
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-lg font-semibold">{person.name}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="size-4" aria-hidden /> {person.title}
                  </span>
                  <DepartmentLabel department={person.department} />
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" aria-hidden /> {person.location}
                  </span>
                  <EmployeeStatus status={person.status} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <a href={`mailto:${person.email}`}>
                    <Mail /> {t('profile.email')}
                  </a>
                </Button>
                <Button>
                  <MessageSquare /> {t('profile.message')}
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {!data || !person ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <VariantTabs defaultValue="overview" className="gap-6">
          <VariantTabsList>
            <VariantTabsTrigger value="overview">{t('profile.tabs.overview')}</VariantTabsTrigger>
            <VariantTabsTrigger value="job">{t('profile.tabs.job')}</VariantTabsTrigger>
            <VariantTabsTrigger value="timeOff" count={data.timeOff.length}>
              {t('profile.tabs.timeOff')}
            </VariantTabsTrigger>
            <VariantTabsTrigger value="documents" count={data.documents.length}>
              {t('profile.tabs.documents')}
            </VariantTabsTrigger>
            <VariantTabsTrigger value="performance">
              {t('profile.tabs.performance')}
            </VariantTabsTrigger>
          </VariantTabsList>

          <VariantTabsContent value="overview">
            <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
              <SectionCard title={t('profile.contact')}>
                <DescriptionList
                  layout="vertical"
                  items={[
                    {
                      key: 'email',
                      term: t('profile.email'),
                      detail: <span className="break-all">{person.email}</span>,
                    },
                    {
                      key: 'phone',
                      term: t('profile.phone'),
                      detail: (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="size-3.5 text-muted-foreground" aria-hidden />{' '}
                          {person.phone}
                        </span>
                      ),
                    },
                    { key: 'location', term: t('profile.location'), detail: person.location },
                    {
                      key: 'tenure',
                      term: t('profile.tenure'),
                      detail: t('profile.years', { count: yearsSince(person.startDate) }),
                    },
                  ]}
                />
              </SectionCard>
              <SectionCard title={t('profile.manager')}>
                {data.manager ? (
                  <PersonLink person={data.manager} />
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
                <p className="mt-6 mb-2 text-sm font-medium">{t('profile.reports')}</p>
                {data.reports.length ? (
                  <div className="space-y-1">
                    {data.reports.map((r) => (
                      <PersonLink key={r.id} person={r} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('profile.noReports')}</p>
                )}
              </SectionCard>
              <SectionCard title={t('profile.balances')}>
                <MeterList
                  items={data.balances.map((b) => ({
                    key: b.type,
                    label: t(`leave.${b.type}`),
                    value: b.used,
                    max: b.total,
                    display: t('profile.used', { used: b.used, total: b.total }),
                    color: LEAVE_COLOR[b.type],
                  }))}
                />
              </SectionCard>
            </div>
          </VariantTabsContent>

          <VariantTabsContent value="job">
            <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
              <SectionCard title={t('profile.tabs.job')}>
                <DescriptionList
                  items={[
                    { key: 'title', term: t('directory.columns.name'), detail: person.title },
                    {
                      key: 'dept',
                      term: t('common.department'),
                      detail: <DepartmentLabel department={person.department} />,
                    },
                    {
                      key: 'level',
                      term: t('profile.level'),
                      detail: t('profile.levelValue', { level: 4 - person.level }),
                    },
                    {
                      key: 'type',
                      term: t('profile.employment'),
                      detail: t(`employment.${person.employmentType}`),
                    },
                    {
                      key: 'start',
                      term: t('profile.started'),
                      detail: longDate(person.startDate),
                    },
                    {
                      key: 'salary',
                      term: t('profile.salary'),
                      detail: (
                        <span className="font-medium tabular-nums">{money(person.salary, 0)}</span>
                      ),
                    },
                  ]}
                />
              </SectionCard>
              <SectionCard title={t('profile.history')}>
                <Timeline
                  items={data.jobHistory.map((job, i) => ({
                    key: job.id,
                    title: job.title,
                    time: `${longDate(job.from)} – ${job.to ? longDate(job.to) : t('profile.present')}`,
                    icon: Briefcase,
                    tone: i === 0 ? 'primary' : 'neutral',
                  }))}
                />
              </SectionCard>
            </div>
          </VariantTabsContent>

          <VariantTabsContent value="timeOff">
            <SectionCard title={t('profile.requests')} flush>
              {data.timeOff.length ? (
                <ul className="divide-y border-t">
                  {data.timeOff.map((req) => (
                    <li key={req.id} className="flex flex-wrap items-center gap-3 px-6 py-3.5">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: LEAVE_COLOR[req.type] }}
                      />
                      <span className="w-32 text-sm font-medium">{t(`leave.${req.type}`)}</span>
                      <span className="flex-1 text-sm text-muted-foreground tabular-nums">
                        {longDate(req.start)} – {longDate(req.end)}
                      </span>
                      <span className="text-sm tabular-nums">
                        {t('common.days', { count: req.days })}
                      </span>
                      <StatusBadge
                        status={req.status}
                        label={t(`timeOff.status.${req.status}`)}
                        tone={TIME_OFF_TONE[req.status]}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  variant="plain"
                  title={t('profile.noRequests')}
                  className="border-t py-10"
                />
              )}
            </SectionCard>
          </VariantTabsContent>

          <VariantTabsContent value="documents" className="max-w-2xl space-y-2">
            {data.documents.map((doc) => (
              <FileItem key={doc.id} name={doc.name} size={doc.size} />
            ))}
          </VariantTabsContent>

          <VariantTabsContent value="performance">
            <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
              <SectionCard title={t('profile.reviews')}>
                <ul className="space-y-5">
                  {data.reviews.map((review) => (
                    <li key={review.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{review.cycle}</p>
                        <RatingStars value={review.rating} showValue size="sm" />
                      </div>
                      <p className="text-sm text-muted-foreground">{review.summary}</p>
                    </li>
                  ))}
                </ul>
              </SectionCard>
              <SectionCard title={t('profile.goals')}>
                <ul className="space-y-5">
                  {data.goals.map((goal) => (
                    <li key={goal.id} className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium">{goal.title}</p>
                        <Tag size="sm" tone={GOAL_TONE[goal.status]} dot>
                          {t(`performance.goalStatus.${goal.status}`)}
                        </Tag>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                          {goal.progress}%
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            </div>
          </VariantTabsContent>
        </VariantTabs>
      )}
    </Page>
  );
}
