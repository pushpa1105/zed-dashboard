import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { Tag } from '@/shared/components/display/tag';
import { InlineEdit } from '@/shared/components/forms/inline-edit';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

import { minutes } from '../lib/format';
import type { BuilderLesson, BuilderSection } from '../model/teaching';

import { LessonTypeIcon } from './lesson-type-icon';

function LessonRow({
  lesson,
  onEdit,
  onDelete,
}: {
  lesson: BuilderLesson;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation('academy');
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform && { ...transform, x: 0 }), transition }}
      className={cn(
        'flex items-center gap-3 border-t bg-card px-4 py-3 sm:px-6',
        isDragging && 'relative z-10 shadow-lg ring-1 ring-primary/30',
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={t('builder.drag', { title: lesson.title })}
        className="-ml-1 cursor-grab rounded p-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <LessonTypeIcon type={lesson.type} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{lesson.title}</p>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">{lesson.summary}</p>
      </div>
      {lesson.preview && (
        <Tag tone="primary" size="sm" className="hidden sm:inline-flex">
          {t('course.preview')}
        </Tag>
      )}
      <span className="w-14 text-right text-xs text-muted-foreground tabular-nums">
        {minutes(lesson.durationMin)}
      </span>
      <Button variant="ghost" size="icon-sm" aria-label={t('builder.editLesson')} onClick={onEdit}>
        <Pencil />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t('builder.deleteLesson')}
        className="text-muted-foreground hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 />
      </Button>
    </li>
  );
}

/** One curriculum section: rename, move, delete, and drag its lessons into order. */
export function CurriculumSection({
  section,
  index,
  total,
  onChange,
  onMove,
  onEditLesson,
}: {
  section: BuilderSection;
  index: number;
  total: number;
  /** `null` deletes the section. */
  onChange: (section: BuilderSection | null) => void;
  onMove: (offset: -1 | 1) => void;
  /** Opens the lesson dialog; no lesson means "add a new one here". */
  onEditLesson: (lesson?: BuilderLesson) => void;
}) {
  const { t } = useTranslation(['academy', 'common']);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const { lessons } = section;
  const setLessons = (next: BuilderLesson[]) => onChange({ ...section, lessons: next });

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const from = lessons.findIndex((l) => l.id === active.id);
    const to = lessons.findIndex((l) => l.id === over?.id);
    if (from !== to && to >= 0) setLessons(arrayMove(lessons, from, to));
  };

  return (
    <SectionCard
      flush
      title={
        <span className="flex items-center gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold tabular-nums">
            {index + 1}
          </span>
          <InlineEdit
            value={section.title}
            aria-label={t('builder.renameSection')}
            onSave={(title) =>
              title.trim()
                ? onChange({ ...section, title: title.trim() })
                : t('builder.titleRequired')
            }
          />
        </span>
      }
      description={t('builder.sectionMeta', {
        count: lessons.length,
        time: minutes(lessons.reduce((s, l) => s + l.durationMin, 0)),
      })}
      action={
        <>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('builder.moveUp')}
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            <ArrowUp />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('builder.moveDown')}
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            <ArrowDown />
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label={t('builder.deleteSection')}>
                <Trash2 />
              </Button>
            }
            title={t('builder.deleteSectionTitle', { title: section.title })}
            description={t('builder.deleteSectionDescription', { count: lessons.length })}
            confirmLabel={t('builder.deleteSection')}
            cancelLabel={t('common:actions.cancel')}
            destructive
            onConfirm={() => onChange(null)}
          />
        </>
      }
      footer={
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => onEditLesson()}>
          <Plus /> {t('builder.addLesson')}
        </Button>
      }
    >
      {lessons.length ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={lessons} strategy={verticalListSortingStrategy}>
            <ul>
              {lessons.map((lesson) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  onEdit={() => onEditLesson(lesson)}
                  onDelete={() => setLessons(lessons.filter((l) => l.id !== lesson.id))}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="border-t px-6 py-6 text-center text-sm text-muted-foreground">
          {t('builder.emptySection')}
        </p>
      )}
    </SectionCard>
  );
}
