import { useTranslation } from '@/core/i18n/use-translation';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { Progress } from '@/shared/ui/progress';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';

import { percent } from '../lib/format';
import { ASSIGNMENT_TONE, COURSE_COLOR, type Assignment, type Course } from '../model/training';

import { DotLabel, FactGrid, PersonLink } from './hr-parts';

type CourseSheetProps = {
  course: Course | undefined;
  assignments: Assignment[];
  onOpenChange: (open: boolean) => void;
};

export function CourseSheet({ course, assignments, onOpenChange }: CourseSheetProps) {
  const { t } = useTranslation('hr');
  const learners = course ? assignments.filter((a) => a.courseId === course.id) : [];
  const completed = learners.filter((a) => a.status === 'completed').length;

  return (
    <Sheet open={!!course} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {course && (
          <>
            <SheetHeader>
              <DotLabel
                color={COURSE_COLOR[course.category]}
                className="text-xs text-muted-foreground"
              >
                {t(`training.categories.${course.category}`)}
              </DotLabel>
              <SheetTitle>{course.title}</SheetTitle>
              <SheetDescription>{course.provider}</SheetDescription>
            </SheetHeader>
            <div className="space-y-6 px-4 pb-6">
              <FactGrid
                items={[
                  {
                    label: t('training.fields.format'),
                    value: t(`training.formats.${course.format}`),
                  },
                  {
                    label: t('training.fields.duration'),
                    value: t('training.hours', { count: course.hours }),
                  },
                  { label: t('training.fields.rating'), value: `${course.rating} / 5` },
                  {
                    label: t('training.fields.type'),
                    value: t(course.required ? 'training.required' : 'training.optional'),
                  },
                ]}
              />
              <section className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{t('training.completion')}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {t('training.completedOf', { completed, total: learners.length })}
                  </span>
                </div>
                <Progress value={percent(completed, learners.length)} className="h-2" />
              </section>
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">
                  {t('training.learners', { count: learners.length })}
                </h3>
                <ul className="divide-y rounded-lg border">
                  {learners.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <PersonLink personId={a.personId} name={a.name} />
                      <StatusBadge
                        status={a.status}
                        tone={ASSIGNMENT_TONE[a.status]}
                        label={t(`training.status.${a.status}`)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
