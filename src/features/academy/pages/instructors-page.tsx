import { BookOpen, Star, Users } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link } from '@/core/router/router';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { Tag } from '@/shared/components/display/tag';
import { Skeleton } from '@/shared/ui/skeleton';

import { instructorsQuery, useInstructors } from '../api/academy-api';
import { QueryError } from '../components/query-error';
import { compact } from '../lib/format';
import type { Instructor } from '../model/academy';
import { academyRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(instructorsQuery());
    return null;
  };

function Stats({ instructor }: { instructor: Instructor }) {
  const { t } = useTranslation('academy');
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <Star className="size-4 fill-warning text-warning" />
        <span className="font-medium text-foreground tabular-nums">
          {instructor.rating.toFixed(1)}
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        <Users className="size-4" />{' '}
        {t('instructors.learners', { value: compact(instructor.students) })}
      </span>
      <span className="flex items-center gap-1.5">
        <BookOpen className="size-4" />{' '}
        {t('instructors.courses', { count: instructor.courses.length })}
      </span>
    </div>
  );
}

function CourseLinks({ instructor }: { instructor: Instructor }) {
  return (
    <ul className="space-y-1.5">
      {instructor.courses.map((course) => (
        <li key={course.id}>
          <Link
            to={academyRoutes.course.href({ courseId: course.id })}
            className="line-clamp-1 text-sm text-primary hover:underline"
          >
            {course.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Faculty directory: one featured instructor, then everyone else. */
export default function InstructorsPage() {
  const { t } = useTranslation('academy');
  const query = useInstructors();
  const instructors = query.data;
  const [featured, ...rest] = [...(instructors ?? [])].sort((a, b) => b.students - a.students);

  return (
    <Page width="full" title={t('instructors.title')} description={t('instructors.description')}>
      {query.isError && !instructors ? (
        <QueryError onRetry={() => void query.refetch()} />
      ) : !featured ? (
        <div className="space-y-6">
          <Skeleton className="h-52 rounded-2xl" />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="grid gap-6 rounded-2xl border bg-card p-6 shadow-xs md:grid-cols-[auto_1fr_16rem] md:p-8">
            <InitialsAvatar name={featured.name} size="xl" className="size-24 text-2xl" />
            <div className="space-y-3">
              <div>
                <Tag tone="primary" size="sm">
                  {t('instructors.featured')}
                </Tag>
                <h2 className="mt-2 text-xl font-semibold">{featured.name}</h2>
                <p className="text-sm text-muted-foreground">{featured.title}</p>
              </div>
              <p className="max-w-2xl text-sm leading-relaxed">{featured.bio}</p>
              <Stats instructor={featured} />
            </div>
            <div className="space-y-2 md:border-l md:pl-6">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t('instructors.teaches')}
              </p>
              <CourseLinks instructor={featured} />
            </div>
          </section>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {rest.map((instructor) => (
              <article
                key={instructor.id}
                className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <InitialsAvatar name={instructor.name} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{instructor.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{instructor.title}</p>
                  </div>
                </div>
                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {instructor.bio}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {instructor.topics.map((topic) => (
                    <Tag key={topic} size="sm">
                      {topic}
                    </Tag>
                  ))}
                </div>
                <div className="mt-auto space-y-3 border-t pt-4">
                  <Stats instructor={instructor} />
                  <CourseLinks instructor={instructor} />
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </Page>
  );
}
