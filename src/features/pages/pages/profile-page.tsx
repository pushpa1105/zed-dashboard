import {
  Calendar,
  CheckCircle2,
  Clock,
  FileUp,
  Mail,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  ThumbsUp,
  UserPlus,
} from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { notify } from '@/core/notify/notify';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { Tag } from '@/shared/components/display/tag';
import { Timeline } from '@/shared/components/display/timeline';
import {
  VariantTabs,
  VariantTabsContent,
  VariantTabsList,
  VariantTabsTrigger,
} from '@/shared/components/navigation/variant-tabs';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Progress } from '@/shared/ui/progress';

import { ACTIVITY, PROFILE, PROJECTS, TEAM } from '../model/demo-data';

const ACTIVITY_ICON = {
  review: ThumbsUp,
  comment: MessageSquare,
  upload: FileUp,
  done: CheckCircle2,
};
const ACTIVITY_TONE = {
  review: 'primary',
  comment: 'blue',
  upload: 'orange',
  done: 'success',
} as const;
const STATUS_TONE = { onTrack: 'success', atRisk: 'warning', done: 'neutral' } as const;

function ProjectsGrid({ limit }: { limit?: number }) {
  const { t } = useTranslation('pages');
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {PROJECTS.slice(0, limit).map((project) => (
        <article
          key={project.id}
          className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{project.name}</p>
              <p className="text-xs text-muted-foreground">{project.team}</p>
            </div>
            <Tag tone={STATUS_TONE[project.status]} size="sm" dot>
              {t(`profile.status.${project.status}`)}
            </Tag>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('profile.progress')}</span>
              <span className="tabular-nums">{project.progress}%</span>
            </div>
            <Progress value={project.progress} />
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3.5" /> {t('profile.due', { date: project.due })}
          </p>
        </article>
      ))}
    </div>
  );
}

function ActivityList({ limit }: { limit?: number }) {
  return (
    <Timeline
      items={ACTIVITY.slice(0, limit).map((a) => ({
        key: a.key,
        title: a.text,
        description: a.meta,
        icon: ACTIVITY_ICON[a.kind],
        tone: ACTIVITY_TONE[a.kind],
      }))}
    />
  );
}

/** In-app template: personal profile with cover, stats and tabbed sections. */
export default function ProfilePage() {
  const { t } = useTranslation('pages');
  const details = [
    { icon: Mail, value: PROFILE.email },
    { icon: MapPin, value: PROFILE.location },
    { icon: Clock, value: PROFILE.timezone },
    {
      icon: Calendar,
      value: t('profile.joined', { date: formatDate(PROFILE.joined, 'MMMM YYYY') }),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1440px] p-4 md:p-8">
      <Head title={t('templates.profile.title')} />
      <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
        <div
          className="h-36 md:h-44"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 120%, color-mix(in oklch, var(--primary-foreground) 25%, transparent), transparent 40%), linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--chart-4) 70%, var(--primary)))',
          }}
        />
        <div className="flex flex-col gap-5 px-6 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <span className="-mt-12 inline-flex w-fit rounded-full bg-card p-1.5 shadow-sm">
              <InitialsAvatar name={PROFILE.name} size="xl" status="online" />
            </span>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">{PROFILE.name}</h1>
              <p className="text-sm text-muted-foreground">
                {PROFILE.role} · {PROFILE.company}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => notify.info(t('profile.toast.message'))}>
              <MessageSquare /> {t('profile.message')}
            </Button>
            <Button
              onClick={() => notify.success(t('profile.toast.follow', { name: PROFILE.name }))}
            >
              <UserPlus /> {t('profile.follow')}
            </Button>
            <Button variant="ghost" size="icon" aria-label={t('profile.more')}>
              <MoreHorizontal />
            </Button>
          </div>
        </div>
        <dl className="grid grid-cols-3 divide-x border-t">
          {(['projects', 'reviews', 'response'] as const).map((stat) => (
            <div key={stat} className="px-6 py-4">
              <dt className="text-xs text-muted-foreground">{t(`profile.stats.${stat}`)}</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">{PROFILE.stats[stat]}</dd>
            </div>
          ))}
        </dl>
      </div>

      <VariantTabs defaultValue="overview" className="mt-8">
        <VariantTabsList>
          <VariantTabsTrigger value="overview">{t('profile.tabs.overview')}</VariantTabsTrigger>
          <VariantTabsTrigger value="projects" count={PROJECTS.length}>
            {t('profile.tabs.projects')}
          </VariantTabsTrigger>
          <VariantTabsTrigger value="team" count={TEAM.length}>
            {t('profile.tabs.team')}
          </VariantTabsTrigger>
          <VariantTabsTrigger value="activity">{t('profile.tabs.activity')}</VariantTabsTrigger>
        </VariantTabsList>

        <VariantTabsContent value="overview" className="mt-2">
          <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
            <SectionCard title={t('profile.about')}>
              <p className="text-sm leading-relaxed text-muted-foreground">{PROFILE.bio}</p>
              <ul className="mt-5 space-y-3 border-t pt-5 text-sm">
                {details.map(({ icon: Icon, value }) => (
                  <li key={value} className="flex items-center gap-3">
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{value}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 border-t pt-5">
                <p className="mb-3 text-xs font-medium text-muted-foreground">
                  {t('profile.skills')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PROFILE.skills.map((skill) => (
                    <Tag key={skill} tone="neutral" size="sm">
                      {skill}
                    </Tag>
                  ))}
                </div>
              </div>
            </SectionCard>
            <div className="grid content-start gap-6">
              <SectionCard title={t('profile.pinned')} description={t('profile.pinnedHint')}>
                <ProjectsGrid limit={3} />
              </SectionCard>
              <SectionCard title={t('profile.recent')}>
                <ActivityList limit={4} />
              </SectionCard>
            </div>
          </div>
        </VariantTabsContent>

        <VariantTabsContent value="projects" className="mt-2">
          <ProjectsGrid />
        </VariantTabsContent>

        <VariantTabsContent value="team" className="mt-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((member) => (
              <div
                key={member.name}
                className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-xs"
              >
                <InitialsAvatar name={member.name} size="lg" status={member.status} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{member.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{member.role}</p>
                </div>
                <Button variant="outline" size="sm">
                  {t('profile.view')}
                </Button>
              </div>
            ))}
          </div>
        </VariantTabsContent>

        <VariantTabsContent value="activity" className="mt-2">
          <SectionCard className="max-w-2xl">
            <ActivityList />
          </SectionCard>
        </VariantTabsContent>
      </VariantTabs>
    </div>
  );
}
