import {
  ArrowRight,
  CalendarClock,
  Flame,
  Medal,
  PlayCircle,
  Radio,
  Trophy,
  Zap,
} from 'lucide-react';

import { useCurrentUser } from '@/core/auth/session';
import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link } from '@/core/router/router';
import { Heatmap } from '@/shared/components/charts/heatmap';
import { ProgressRing } from '@/shared/components/charts/progress-ring';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { Tag } from '@/shared/components/display/tag';
import { Button } from '@/shared/ui/button';
import { Progress } from '@/shared/ui/progress';
import { Skeleton } from '@/shared/ui/skeleton';

import { homeQuery, useAcademyHome } from '../api/academy-api';
import { CourseCard } from '../components/course-card';
import { CourseCover } from '../components/course-cover';
import { QueryError } from '../components/query-error';
import { dayTime, minutes } from '../lib/format';
import type { AcademyHome } from '../model/academy';
import { academyRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(homeQuery());
    return null;
  };

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const KIND_TONE = {
  live: 'danger',
  'office-hours': 'info',
  workshop: 'violet',
  exam: 'warning',
} as const;

function Hero({ data }: { data: AcademyHome }) {
  const { t } = useTranslation('academy');
  const user = useCurrentUser();
  const { learner } = data;
  const goal = Math.round((learner.weeklyDoneMin / learner.weeklyGoalMin) * 100);
  const next = data.upcoming[0];

  return (
    <section className="grid gap-6 rounded-2xl border bg-card p-6 shadow-xs lg:grid-cols-[1fr_auto_22rem] lg:items-center lg:p-8">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{t('home.hello', { name: user.firstName })}</p>
        <h2 className="text-2xl leading-tight font-semibold tracking-tight text-balance">
          {t('home.headline', { minutes: learner.weeklyGoalMin - learner.weeklyDoneMin })}
        </h2>
        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm">
          <span className="flex items-center gap-1.5">
            <Flame className="size-4 text-chart-3" />
            <strong className="tabular-nums">{learner.streakDays}</strong> {t('home.streak')}
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="size-4 text-warning" />
            <strong className="tabular-nums">{learner.xp.toLocaleString('en-US')}</strong> XP
          </span>
          <span className="flex items-center gap-1.5">
            <Medal className="size-4 text-primary" />
            {t('home.level', { level: learner.level })}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4 lg:border-x lg:px-8">
        <ProgressRing value={goal} size={76} strokeWidth={8} />
        <div>
          <p className="text-sm font-medium">{t('home.weeklyGoal')}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {minutes(learner.weeklyDoneMin)} / {minutes(learner.weeklyGoalMin)}
          </p>
        </div>
      </div>
      {next && (
        <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/12 text-destructive">
            <Radio className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {t('home.nextLive', { when: dayTime(next.startsAt) })}
            </p>
            <p className="truncate text-sm font-medium">{next.title}</p>
          </div>
        </div>
      )}
    </section>
  );
}

function ContinueLearning({ items }: { items: AcademyHome['continueLearning'] }) {
  const { t } = useTranslation('academy');
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <h2 className="text-base font-semibold">{t('home.continue')}</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link to={academyRoutes.catalog.href({ enrolled: 1 })}>
            {t('home.allCourses')} <ArrowRight />
          </Link>
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.courseId}
            className="flex overflow-hidden rounded-xl border bg-card shadow-xs"
          >
            <CourseCover
              color={item.color}
              category={item.category}
              size="sm"
              className="w-20 shrink-0"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{item.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.nextLessonTitle
                    ? t('home.upNext', { lesson: item.nextLessonTitle })
                    : t('card.completed')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={item.progress} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground tabular-nums">{item.progress}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {t('home.left', { time: minutes(item.minutesLeft) })}
                </span>
                {item.nextLessonId && (
                  <Button size="sm" asChild>
                    <Link
                      to={academyRoutes.lesson.href({
                        courseId: item.courseId,
                        lessonId: item.nextLessonId,
                      })}
                    >
                      <PlayCircle /> {t('home.resume')}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Learner dashboard: progress, streak, what to do next. */
export default function AcademyHomePage() {
  const { t } = useTranslation('academy');
  const home = useAcademyHome();
  const data = home.data;

  return (
    <Page width="full" title={t('home.title')} description={t('home.description')}>
      {home.isError && !data ? (
        <QueryError onRetry={() => void home.refetch()} />
      ) : !data ? (
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-2xl" />
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <Hero data={data} />
          <ContinueLearning items={data.continueLearning} />
          <div className="grid items-start gap-6 xl:grid-cols-3">
            <SectionCard
              className="xl:col-span-2"
              title={t('home.activity.title')}
              description={t('home.activity.description')}
            >
              <Heatmap
                rows={WEEKDAYS}
                columns={Array.from({ length: 12 }, (_, i) =>
                  i === 11 ? t('home.activity.thisWeek') : `W${i + 1}`,
                )}
                values={data.activity}
                valueFormatter={(v) => minutes(v)}
              />
            </SectionCard>
            <SectionCard
              title={t('home.upcoming.title')}
              description={t('home.upcoming.description')}
              action={
                <Button variant="ghost" size="icon-sm" asChild aria-label={t('nav.schedule')}>
                  <Link to={academyRoutes.schedule.href()}>
                    <CalendarClock />
                  </Link>
                </Button>
              }
            >
              <ul className="space-y-4">
                {data.upcoming.map((session) => {
                  const d = new Date(session.startsAt);
                  return (
                    <li key={session.id} className="flex gap-3">
                      <div className="flex w-12 shrink-0 flex-col items-center rounded-lg border py-1.5">
                        <span className="text-[0.625rem] font-medium text-muted-foreground uppercase">
                          {d.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span className="text-lg leading-none font-semibold tabular-nums">
                          {d.getDate()}
                        </span>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm leading-snug font-medium">{session.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} ·{' '}
                          {minutes(session.durationMin)} · {session.instructor}
                        </p>
                        <Tag tone={KIND_TONE[session.kind]} size="sm" dot>
                          {t(`kinds.${session.kind}`)}
                        </Tag>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </SectionCard>
          </div>
          <div className="grid items-start gap-6 xl:grid-cols-3">
            <SectionCard title={t('home.achievements')}>
              <ul className="space-y-4">
                {data.achievements.map((a) => (
                  <li key={a.id} className="flex items-center gap-3">
                    <span
                      className={
                        a.progress === 100
                          ? 'flex size-10 shrink-0 items-center justify-center rounded-full bg-warning/20 text-warning'
                          : 'flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground'
                      }
                    >
                      <Trophy className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{a.name}</p>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {a.progress}%
                        </span>
                      </div>
                      <Progress value={a.progress} className="h-1.5" />
                      <p className="text-xs text-muted-foreground">{a.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </SectionCard>
            <div className="space-y-4 xl:col-span-2">
              <h2 className="text-base font-semibold">{t('home.recommended')}</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {data.recommended.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
