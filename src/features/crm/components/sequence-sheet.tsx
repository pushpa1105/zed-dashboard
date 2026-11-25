import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { NumberInput } from '@/shared/components/forms/number-input';
import { Button } from '@/shared/ui/button';
import { FieldGroup } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';

import { useSaveSequence } from '../api/crm-api';
import {
  SEQUENCE_STATUSES,
  sequenceInputSchema,
  STEP_KINDS,
  type Sequence,
  type SequenceInput,
} from '../model/crm';

const BLANK: SequenceInput = {
  name: '',
  status: 'draft',
  steps: [{ kind: 'email', delayDays: 0, subject: '' }],
};

/** Create (`sequence` undefined) or edit a sequence and its steps. */
export function SequenceSheet({
  open,
  sequence,
  onOpenChange,
}: {
  open: boolean;
  sequence?: Sequence;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation('crm');
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-xl">
        <SheetHeader className="border-b">
          <SheetTitle>{sequence ? t('sequences.edit') : t('sequences.new')}</SheetTitle>
          <SheetDescription>{t('sequences.form.description')}</SheetDescription>
        </SheetHeader>
        <SequenceForm sequence={sequence} onDone={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}

function SequenceForm({ sequence, onDone }: { sequence?: Sequence; onDone: () => void }) {
  const { t } = useTranslation('crm');
  const save = useSaveSequence();
  const form = useForm<SequenceInput>({
    resolver: zodResolver(sequenceInputSchema),
    defaultValues: sequence
      ? { name: sequence.name, status: sequence.status, steps: sequence.steps }
      : BLANK,
  });
  const steps = useFieldArray({ control: form.control, name: 'steps' });

  const submit = form.handleSubmit((values) =>
    save.mutate({ ...values, id: sequence?.id }, { onSuccess: onDone }),
  );

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
            <FormField
              control={form.control}
              name="name"
              label={t('sequences.form.name')}
              required
              render={({ field, id, invalid }) => (
                <Input
                  {...field}
                  id={id}
                  aria-invalid={invalid}
                  placeholder={t('sequences.form.namePlaceholder')}
                />
              )}
            />
            <FormField
              control={form.control}
              name="status"
              label={t('sequences.form.status')}
              render={({ field, id }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id={id} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEQUENCE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`sequences.status.${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </FieldGroup>

        <fieldset className="space-y-3">
          <legend className="mb-3 text-sm font-medium">{t('sequences.form.steps')}</legend>
          <ol className="space-y-3">
            {steps.fields.map((step, index) => (
              <li key={step.id} className="rounded-lg border bg-muted/30 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t('sequences.stepN', { n: index + 1 })}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={steps.fields.length === 1}
                    onClick={() => steps.remove(index)}
                    aria-label={t('sequences.form.removeStep', { n: index + 1 })}
                  >
                    <Trash2 />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-[8rem_7rem_1fr]">
                  <FormField
                    control={form.control}
                    name={`steps.${index}.kind`}
                    label={t('sequences.form.kind')}
                    render={({ field, id }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id={id} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STEP_KINDS.map((k) => (
                            <SelectItem key={k} value={k}>
                              {t(`sequences.kind.${k}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`steps.${index}.delayDays`}
                    label={t('sequences.form.delay')}
                    render={({ field, id, invalid }) => (
                      <NumberInput
                        id={id}
                        invalid={invalid}
                        value={field.value}
                        onChange={(v) => field.onChange(v ?? 0)}
                        min={0}
                        max={30}
                      />
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`steps.${index}.subject`}
                    label={t('sequences.form.subject')}
                    required
                    render={({ field, id, invalid }) => (
                      <Input {...field} id={id} aria-invalid={invalid} />
                    )}
                  />
                </div>
              </li>
            ))}
          </ol>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => steps.append({ kind: 'email', delayDays: 2, subject: '' })}
          >
            <Plus /> {t('sequences.form.addStep')}
          </Button>
        </fieldset>
      </div>
      <SheetFooter className="flex-row justify-end border-t">
        <Button type="button" variant="outline" onClick={onDone}>
          {t('quickAdd.cancel')}
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {t('sequences.form.save')}
        </Button>
      </SheetFooter>
    </form>
  );
}
