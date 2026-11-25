import {
  Award,
  CheckCircle2,
  Circle,
  Clock,
  Infinity as InfinityIcon,
  ListChecks,
  Lock,
  MessagesSquare,
  PencilRuler,
  PlayCircle,
  Star,
  Users,
} from 'lucide-react';

import { Can } from '@/core/auth/access';
import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { Link, useParams } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { RatingStars } from '@/shared/components/display/rating-stars';
import { Tag } from '@/shared/components/display/tag';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';
import { Button } from '@/shared/ui/button';
import { Progress } from '@/shared/ui/progress';
import { Skeleton } from '@/shared/ui/skeleton';
import { Spinner } from '@/shared/ui/spinner';

import { courseQuery, useCourse, useEnroll } from '../api/academy-api';
import { CourseCover } from '../components/course-cover';
import { LessonTypeIcon } from '../components/lesson-type-icon';
import { QueryError } from '../components/query-error';
import { compact, longDate, minutes, price } from '../lib/format';
import type { CourseDetail } from '../model/academy';
import { academyRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(courseQuery(params.courseId!));
    return null;
  };

function EnrolCard({ course }: { course: CourseDetail }) {
  const { t } = useTranslation('academy');
  const enroll = useEnroll();
  const next = course.modules.flatMap((m) => m.lessons).find((l) => !l.completed);
  const first = course.modules[0]?.lessons[0];
  const target = next ?? first;

  return (
    <aside className="overflow-hidden rounded-xl border bg-card shadow-sm lg:sticky lg:top-24">
      <CourseCover color={course.color} category={course.category} size="lg" className="h-40" />
      <div className="space-y-5 p-6">
        {course.enrolled ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{t('course.yourProgress')}</span>
              <span className="tabular-nums">{course.progress}%</span>
            </div>
            <Progress value={course.progress} className="h-2" />
          </div>
        ) : (
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            {price(course.price) ?? t('card.free')}
          </p>
        )}
        {course.enrolled ? (
          <div className="space-y-2">
            {target && (
              <Button size="lg" className="w-full" asChild>
                <Link to={academyRoutes.lesson.href({ courseId: course.id, lessonId: target.id })}>
                  <PlayCircle /> {course.progress ? t('course.continue') : t('course.start')}
                </Link>
              </Button>
            )}
            <Button size="lg" variant="outline" className="w-full" asChild>
              <Link to={academyRoutes.quiz.href({ courseId: course.id })}>
                <ListChecks /> {t('course.quiz')}
              </Link>
            </Button>
          </div>
        ) : (
          <Button
            size="lg"
            className="w-full"
            disabled={enroll.isPending}
            onClick={() => enroll.mutate(course.id)}
          >
            {enroll.isPending && <Spinner />} {t('course.enrol')}
          </Button>
        )}
        <ul className="space-y-2.5 text-sm">
          <li className="flex items-center gap-2.5">
            <Clock className="size-4 text-muted-foreground" />
            {t('course.includes.video', { time: minutes(course.durationMin) })}
          </li>
          <li className="flex items-center gap-2.5">
            <MessagesSquare className="size-4 text-muted-foreground" />
            {t('course.includes.qa')}
          </li>
          <li className="flex items-center gap-2.5">
            <InfinityIcon className="size-4 text-muted-foreground" />
            {t('course.includes.lifetime')}
          </li>
          <li className="flex items-center gap-2.5">
            <Award className="size-4 text-muted-foreground" />
            {t('course.includes.certificate')}
          </li>
        </ul>
      </div>
    </aside>
  );
}

function Curriculum({ course }: { course: CourseDetail }) {
  const { t } = useTranslation('academy');
  const lessons = course.modules.flatMap((m) => m.lessons);
  return (
    <SectionCard
      title={t('course.curriculum')}
      description={t('course.curriculumMeta', {
        modules: course.modules.length,
        lessons: lessons.length,
        time: minutes(course.durationMin),
      })}
      action={
        <Can roles={['ADMIN']}>
          <Button size="sm" variant="outline" asChild>
            <Link to={academyRoutes.builder.href({ courseId: course.id })}>
              <PencilRuler /> {t('course.edit')}
            </Link>
          </Button>
        </Can>
      }
      flush
    >
      <Accordion type="multiple" defaultValue={[course.modules[0]!.id]} className="border-t">
        {course.modules.map((module, m) => {
          const done = module.lessons.filter((l) => l.completed).length;
          return (
            <AccordionItem key={module.id} value={module.id} className="px-6">
              <AccordionTrigger className="py-4 hover:no-underline">
                <span className="flex flex-1 items-center gap-3 text-left">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold tabular-nums">
                    {m + 1}
                  </span>
                  <span className="flex-1 font-medium">{module.title}</span>
                  <span className="mr-2 hidden text-xs font-normal text-muted-foreground tabular-nums sm:inline">
                    {done}/{module.lessons.length} ·{' '}
                    {minutes(module.lessons.reduce((s, l) => s + l.durationMin, 0))}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="ml-10 space-y-1 border-l pl-4">
                  {module.lessons.map((lesson) => {
                    const open = course.enrolled || lesson.preview;
                    const row = (
                      <>
                        <LessonTypeIcon type={lesson.type} />
                        <span className="flex-1 truncate">{lesson.title}</span>
                        {lesson.preview && !course.enrolled && (
                          <Tag tone="primary" size="sm">
                            {t('course.preview')}
                          </Tag>
                        )}
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {minutes(lesson.durationMin)}
                        </span>
                        {lesson.completed ? (
                          <CheckCircle2
                            className="size-4 text-success"
                            aria-label={t('course.done')}
                          />
                        ) : open ? (
                          <Circle className="size-4 text-muted-foreground/50" />
                        ) : (
                          <Lock
                            className="size-4 text-muted-foreground/60"
                            aria-label={t('course.locked')}
                          />
                        )}
                      </>
                    );
                    return (
                      <li key={lesson.id}>
                        {open ? (
                          <Link
                            to={academyRoutes.lesson.href({
                              courseId: course.id,
                              lessonId: lesson.id,
                            })}
                            className="flex h-10 items-center gap-3 rounded-md px-2 text-sm no-underline! hover:bg-muted"
                          >
                            {row}
                          </Link>
                        ) : (
                          <span className="flex h-10 items-center gap-3 px-2 text-sm text-muted-foreground">
                            {row}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </SectionCard>
  );
}

/** Course landing: what it teaches, the full curriculum, reviews and enrolment. */
export default function CoursePage() {
  const { t } = useTranslation('academy');
  const { courseId } = useParams();
  const query = useCourse(courseId!);
  const course = query.data;

  if (query.isError && !course) {
    return (
      <div className="mx-auto max-w-[1440px] p-4 md:p-8">
        <QueryError onRetry={() => void query.refetch()} />
      </div>
    );
  }
  if (!course) {
    return (
      <div className="mx-auto max-w-[1440px] space-y-6 p-4 md:p-8">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <>
      <Head title={course.title} description={course.subtitle} />
      <div className="mx-auto w-full max-w-[1440px] space-y-8 p-4 md:p-8">
        <section
          className="rounded-2xl border p-6 md:p-10"
          style={{
            background: `linear-gradient(120deg, color-mix(in srgb, ${course.color} 14%, var(--card)), var(--card) 70%)`,
          }}
        >
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Link
                to={academyRoutes.catalog.href()}
                className="text-muted-foreground hover:text-foreground"
              >
                {t('nav.catalog')}
              </Link>
              <span className="text-muted-foreground/50">/</span>
              <span className="text-muted-foreground">{t(`categories.${course.category}`)}</span>
            </div>
            <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance md:text-4xl">
              {course.title}
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">{course.subtitle}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-sm">
              <span className="flex items-center gap-1.5">
                <Star className="size-4 fill-warning text-warning" />
                <strong className="tabular-nums">{course.rating.toFixed(1)}</strong>
                <span className="text-muted-foreground tabular-nums">
                  {t('course.ratings', { count: course.reviewCount })}
                </span>
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="size-4" />{' '}
                {t('course.students', { value: compact(course.students) })}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-4" /> {minutes(course.durationMin)}
              </span>
              <Tag size="sm">{t(`levels.${course.level}`)}</Tag>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <InitialsAvatar name={course.instructor.name} size="sm" />
              <p className="text-sm">
                <span className="font-medium">{course.instructor.name}</span>
                <span className="text-muted-foreground"> · {course.instructor.title}</span>
              </p>
            </div>
          </div>
        </section>

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
          <div className="min-w-0 space-y-6 lg:order-1">
            <SectionCard title={t('course.outcomes')}>
              <ul className="grid gap-3 sm:grid-cols-2">
                {course.outcomes.map((outcome) => (
                  <li key={outcome} className="flex gap-2.5 text-sm">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                    {outcome}
                  </li>
                ))}
              </ul>
            </SectionCard>
            <Curriculum course={course} />
            <SectionCard title={t('course.instructor')}>
              <div className="flex flex-col gap-4 sm:flex-row">
                <InitialsAvatar name={course.instructor.name} size="xl" />
                <div className="space-y-2">
                  <div>
                    <p className="font-semibold">{course.instructor.name}</p>
                    <p className="text-sm text-muted-foreground">{course.instructor.title}</p>
                  </div>
                  <p className="text-sm leading-relaxed">{course.instructor.bio}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {course.instructor.topics.map((topic) => (
                      <Tag key={topic} size="sm">
                        {topic}
                      </Tag>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
            <SectionCard
              title={t('course.reviews')}
              action={<RatingStars value={course.rating} showValue count={course.reviewCount} />}
            >
              <ul className="grid gap-6 md:grid-cols-2">
                {course.reviews.map((review) => (
                  <li key={review.id} className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <InitialsAvatar name={review.author} size="sm" />
                      <div>
                        <p className="text-sm font-medium">{review.author}</p>
                        <p className="text-xs text-muted-foreground">
                          {longDate(review.createdAt)}
                        </p>
                      </div>
                    </div>
                    <RatingStars value={review.rating} size="sm" />
                    <p className="text-sm leading-relaxed text-muted-foreground">{review.body}</p>
                  </li>
                ))}
              </ul>
            </SectionCard>
            <SectionCard title={t('course.requirements')}>
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                {course.requirements.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </SectionCard>
          </div>
          <div className="lg:order-2">
            <EnrolCard course={course} />
          </div>
        </div>
      </div>
    </>
  );
}
