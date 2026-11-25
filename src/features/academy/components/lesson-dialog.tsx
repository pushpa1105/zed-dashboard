import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { NumberInput } from '@/shared/components/forms/number-input';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { SwitchRow } from '@/shared/components/forms/switch-row';
import { TextareaWithCounter } from '@/shared/components/forms/textarea-with-counter';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Spinner } from '@/shared/ui/spinner';

import { useSaveLesson } from '../api/teaching-api';
import { LESSON_TYPES } from '../model/academy';
import {
  lessonInputSchema,
  type BuilderLesson,
  type BuilderSection,
  type LessonInput,
} from '../model/teaching';

import { LessonTypeIcon } from './lesson-type-icon';

/** What the dialog edits: an existing lesson, or a new one in `sectionId`. */
export type LessonTarget = { sectionId: string; lesson?: BuilderLesson };

const blank = { title: '', type: 'video', durationMin: 10, preview: false, summary: '' } as const;

/** Adds a lesson to a section or edits one, including moving it to another section. */
export function LessonDialog({
  courseId,
  sections,
  target,
  onClose,
}: {
  courseId: string;
  sections: BuilderSection[];
  target: LessonTarget | null;
  onClose: () => void;
}) {
  const { t } = useTranslation(['academy', 'common']);
  const save = useSaveLesson(courseId);
  const lesson = target?.lesson;
  const form = useForm<LessonInput>({
    resolver: zodResolver(lessonInputSchema),
    values: { ...blank, ...lesson, sectionId: target?.sectionId ?? '' },
  });

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t(lesson ? 'builder.form.editTitle' : 'builder.form.addTitle')}
          </DialogTitle>
          <DialogDescription>{t('builder.form.description')}</DialogDescription>
        </DialogHeader>
        <form
          id="lesson-form"
          noValidate
          className="space-y-5"
          onSubmit={form.handleSubmit((values) =>
            save.mutate(
              { ...values, id: lesson?.id ?? crypto.randomUUID() },
              { onSuccess: onClose },
            ),
          )}
        >
          <FormField
            control={form.control}
            name="title"
            label={t('builder.form.title')}
            required
            render={({ field, id, invalid }) => (
              <Input id={id} aria-invalid={invalid} autoComplete="off" {...field} />
            )}
          />
          <FormField
            control={form.control}
            name="type"
            label={t('builder.form.type')}
            render={({ field }) => (
              <SegmentedControl
                block
                value={field.value}
                onChange={field.onChange}
                options={LESSON_TYPES.map((type) => ({
                  value: type,
                  label: t(`lessonTypes.${type}`),
                  icon: <LessonTypeIcon type={type} className="text-current" />,
                }))}
              />
            )}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="sectionId"
              label={t('builder.form.section')}
              render={({ field, id, invalid }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id={id} aria-invalid={invalid} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FormField
              control={form.control}
              name="durationMin"
              label={t('builder.form.duration')}
              render={({ field, id, invalid }) => (
                <NumberInput
                  id={id}
                  value={field.value}
                  onChange={field.onChange}
                  min={1}
                  max={180}
                  suffix={t('builder.form.minutes')}
                  invalid={invalid}
                />
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="summary"
            label={t('builder.form.summary')}
            render={({ field, id }) => (
              <TextareaWithCounter id={id} rows={3} maxLength={280} {...field} />
            )}
          />
          <FormField
            control={form.control}
            name="preview"
            render={({ field }) => (
              <SwitchRow
                bordered
                label={t('builder.form.preview')}
                description={t('builder.form.previewHint')}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button type="submit" form="lesson-form" disabled={save.isPending}>
            {save.isPending && <Spinner />} {t('common:actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
