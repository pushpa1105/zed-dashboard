import { arrayMove } from '@dnd-kit/sortable';
import { Eye, LayoutList, Plus } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useParams } from '@/core/router/router';
import { MeterList } from '@/shared/components/dashboard/meter-list';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { DescriptionList } from '@/shared/components/display/description-list';
import { EmptyState } from '@/shared/components/display/empty-state';
import { formatRelative } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Skeleton } from '@/shared/ui/skeleton';
import { Switch } from '@/shared/ui/switch';

import { builderQuery, useBuilder, usePublishCourse, useSaveSections } from '../api/teaching-api';
import { CurriculumSection } from '../components/curriculum-section';
import { LessonDialog, type LessonTarget } from '../components/lesson-dialog';
import { QueryState } from '../components/query-state';
import { minutes } from '../lib/format';
import { LESSON_TYPES } from '../model/academy';
import type { BuilderSection, CourseBuilder } from '../model/teaching';
import { academyRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(builderQuery(params.courseId!));
    return null;
  };

function PublishToggle({ builder }: { builder: CourseBuilder }) {
  const { t } = useTranslation('academy');
  const publish = usePublishCourse(builder.courseId);
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
      <Switch
        id="course-published"
        checked={builder.published}
        disabled={publish.isPending}
        onCheckedChange={(published) => publish.mutate(published)}
      />
      <Label htmlFor="course-published">
        {t(builder.published ? 'builder.published' : 'builder.draft')}
      </Label>
    </div>
  );
}

function Overview({ builder }: { builder: CourseBuilder }) {
  const { t } = useTranslation('academy');
  const lessons = builder.sections.flatMap((s) => s.lessons);
  const total = lessons.reduce((s, l) => s + l.durationMin, 0);
  return (
    <div className="space-y-6 lg:sticky lg:top-24">
      <SectionCard title={t('builder.overview')}>
        <DescriptionList
          items={[
            { key: 'sections', term: t('builder.stats.sections'), detail: builder.sections.length },
            { key: 'lessons', term: t('builder.stats.lessons'), detail: lessons.length },
            { key: 'duration', term: t('builder.stats.duration'), detail: minutes(total) },
            {
              key: 'previews',
              term: t('builder.stats.previews'),
              detail: lessons.filter((l) => l.preview).length,
            },
            {
              key: 'saved',
              term: t('builder.stats.saved'),
              detail: formatRelative(builder.updatedAt),
            },
          ]}
        />
      </SectionCard>
      <SectionCard title={t('builder.mix')} description={t('builder.mixHint')}>
        <MeterList
          items={LESSON_TYPES.map((type) => {
            const value = lessons
              .filter((l) => l.type === type)
              .reduce((s, l) => s + l.durationMin, 0);
            return {
              key: type,
              label: t(`lessonTypes.${type}`),
              value,
              max: total,
              display: minutes(value),
            };
          })}
        />
      </SectionCard>
    </div>
  );
}

function Builder({ builder }: { builder: CourseBuilder }) {
  const { t } = useTranslation('academy');
  const save = useSaveSections(builder.courseId);
  const [target, setTarget] = useState<LessonTarget | null>(null);
  const { sections } = builder;

  const addSection = () =>
    save.mutate([
      ...sections,
      { id: crypto.randomUUID(), title: t('builder.newSection'), lessons: [] },
    ]);
  const setSection = (index: number, next: BuilderSection | null) =>
    save.mutate(
      next
        ? sections.map((s, i) => (i === index ? next : s))
        : sections.filter((_, i) => i !== index),
    );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="min-w-0 space-y-4">
        {sections.length ? (
          sections.map((section, i) => (
            <CurriculumSection
              key={section.id}
              section={section}
              index={i}
              total={sections.length}
              onChange={(next) => setSection(i, next)}
              onMove={(offset) => save.mutate(arrayMove(sections, i, i + offset))}
              onEditLesson={(lesson) => setTarget({ sectionId: section.id, lesson })}
            />
          ))
        ) : (
          <EmptyState
            icon={LayoutList}
            title={t('builder.empty.title')}
            description={t('builder.empty.description')}
          />
        )}
        <Button variant="outline" className="w-full border-dashed" onClick={addSection}>
          <Plus /> {t('builder.addSection')}
        </Button>
      </div>
      <Overview builder={builder} />
      <LessonDialog
        courseId={builder.courseId}
        sections={sections}
        target={target}
        onClose={() => setTarget(null)}
      />
    </div>
  );
}

/** Instructor curriculum editor: sections and lessons, ordering, and publishing. */
export default function BuilderPage() {
  const { t } = useTranslation('academy');
  const { courseId } = useParams();
  const query = useBuilder(courseId!);

  return (
    <Page
      title={query.data?.title ?? t('builder.title')}
      description={t('builder.description')}
      actions={
        query.data && (
          <>
            <Button variant="outline" asChild>
              <Link to={academyRoutes.course.href({ courseId: courseId! })}>
                <Eye /> {t('builder.viewCourse')}
              </Link>
            </Button>
            <PublishToggle builder={query.data} />
          </>
        )
      }
    >
      <QueryState
        query={query}
        skeleton={
          <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-80 rounded-xl" />
          </div>
        }
      >
        {(builder) => <Builder builder={builder} />}
      </QueryState>
    </Page>
  );
}
