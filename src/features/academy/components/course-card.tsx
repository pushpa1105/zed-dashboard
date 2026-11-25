import { Clock, PlayCircle, Star, Users } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { Tag } from '@/shared/components/display/tag';
import { cn } from '@/shared/lib/cn';
import { Progress } from '@/shared/ui/progress';

import { compact, minutes, price } from '../lib/format';
import type { CourseSummary } from '../model/academy';
import { academyRoutes } from '../routes';

import { CourseCover } from './course-cover';

const LEVEL_TONE = { beginner: 'success', intermediate: 'info', advanced: 'violet' } as const;

/** Catalog card: cover, title, instructor, facts and either price or progress. */
export function CourseCard({ course, className }: { course: CourseSummary; className?: string }) {
  const { t } = useTranslation('academy');
  const amount = price(course.price);

  return (
    <Link
      to={academyRoutes.course.href({ courseId: course.id })}
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-all outline-none hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring/50',
        className,
      )}
    >
      <CourseCover color={course.color} category={course.category} className="h-32" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2">
          <Tag tone={LEVEL_TONE[course.level]} size="sm">
            {t(`levels.${course.level}`)}
          </Tag>
          <span className="text-xs text-muted-foreground">
            {t(`categories.${course.category}`)}
          </span>
        </div>
        <div className="space-y-1">
          <h3 className="line-clamp-2 leading-snug font-semibold group-hover:text-primary">
            {course.title}
          </h3>
          <p className="text-sm text-muted-foreground">{course.instructor.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="size-3.5 fill-warning text-warning" />
            <span className="font-medium text-foreground tabular-nums">
              {course.rating.toFixed(1)}
            </span>
            <span className="tabular-nums">({compact(course.reviewCount)})</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" /> {minutes(course.durationMin)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" /> {compact(course.students)}
          </span>
        </div>
        <div className="mt-auto pt-1">
          {course.enrolled ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-medium text-primary">
                  <PlayCircle className="size-3.5" />
                  {course.progress === 100 ? t('card.completed') : t('card.continue')}
                </span>
                <span className="text-muted-foreground tabular-nums">{course.progress}%</span>
              </div>
              <Progress value={course.progress} className="h-1.5" />
            </div>
          ) : (
            <p className="text-base font-semibold tabular-nums">{amount ?? t('card.free')}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
