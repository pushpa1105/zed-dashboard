import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { AreaChart } from '@/shared/components/charts/area-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import type { CourseReport, Reports } from '../model/teaching';

/** Share of learners who reach each lesson of a course, with the steepest drop called out. */
export function DropoffChart({
  courses,
  dropoff,
}: {
  courses: CourseReport[];
  dropoff: Reports['dropoff'];
}) {
  const { t } = useTranslation('academy');
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const lessons = dropoff[courseId] ?? [];
  const steepest = lessons
    .map((l, i) => ({ ...l, drop: i ? lessons[i - 1]!.learners - l.learners : 0 }))
    .reduce((max, l) => (l.drop > max.drop ? l : max), { title: '', learners: 0, drop: 0 });

  return (
    <SectionCard
      title={t('reports.dropoff.title')}
      description={
        steepest.drop
          ? t('reports.dropoff.steepest', { title: steepest.title, points: steepest.drop })
          : t('reports.dropoff.description')
      }
      action={
        <Select value={courseId} onValueChange={setCourseId}>
          <SelectTrigger className="w-56" aria-label={t('reports.leaderboard.course')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <AreaChart
        data={lessons.map((l, i) => ({ lesson: `${i + 1}. ${l.title}`, learners: l.learners }))}
        xKey="lesson"
        series={[{ key: 'learners', label: t('reports.dropoff.learners') }]}
        curve="monotone"
        valueFormatter={(v) => `${v}%`}
        xFormatter={(label) => label.split('.')[0]!}
        className="h-64"
      />
    </SectionCard>
  );
}
