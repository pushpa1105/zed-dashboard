import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { NumberInput } from '@/shared/components/forms/number-input';
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

import { useSaveGoal } from '../api/analytics-api';
import { GOAL_EVENTS, goalInputSchema, type Goal, type GoalInput } from '../model/analytics';

const EMPTY: GoalInput = { name: '', event: 'signup', target: 3, value: 0 };

/** Creates a goal (`goal === 'new'`) or edits an existing one. */
export function GoalDialog({ goal, onClose }: { goal: Goal | 'new' | null; onClose: () => void }) {
  const { t } = useTranslation('analytics');
  const save = useSaveGoal();
  const editing = goal && goal !== 'new' ? goal : null;
  const form = useForm<GoalInput>({
    resolver: zodResolver(goalInputSchema),
    values: editing
      ? { name: editing.name, event: editing.event, target: editing.target, value: editing.value }
      : EMPTY,
  });

  return (
    <Dialog open={!!goal} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t(editing ? 'goals.form.editTitle' : 'goals.form.createTitle')}
          </DialogTitle>
          <DialogDescription>{t('goals.form.description')}</DialogDescription>
        </DialogHeader>
        <form
          id="goal-form"
          noValidate
          className="grid gap-5 sm:grid-cols-2"
          onSubmit={form.handleSubmit((input) =>
            save.mutate({ id: editing?.id, input }, { onSuccess: onClose }),
          )}
        >
          <FormField
            control={form.control}
            name="name"
            label={t('goals.form.name')}
            required
            className="sm:col-span-2"
            render={({ field, id, invalid }) => (
              <Input
                id={id}
                {...field}
                aria-invalid={invalid}
                placeholder={t('goals.form.namePlaceholder')}
              />
            )}
          />
          <FormField
            control={form.control}
            name="event"
            label={t('goals.form.event')}
            description={t('goals.form.eventHint')}
            className="sm:col-span-2"
            render={({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_EVENTS.map((event) => (
                    <SelectItem key={event} value={event}>
                      {t(`goals.events.${event}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FormField
            control={form.control}
            name="target"
            label={t('goals.form.target')}
            description={t('goals.form.targetHint')}
            required
            render={({ field, id, invalid }) => (
              <NumberInput
                id={id}
                value={field.value}
                onChange={(v) => field.onChange(v ?? 0)}
                invalid={invalid}
                min={0}
                max={100}
                step={0.1}
                precision={1}
                suffix="%"
              />
            )}
          />
          <FormField
            control={form.control}
            name="value"
            label={t('goals.form.value')}
            description={t('goals.form.valueHint')}
            render={({ field, id, invalid }) => (
              <NumberInput
                id={id}
                value={field.value}
                onChange={(v) => field.onChange(v ?? 0)}
                invalid={invalid}
                min={0}
                format="currency"
                currency="USD"
              />
            )}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('goals.form.cancel')}
          </Button>
          <Button type="submit" form="goal-form" disabled={save.isPending}>
            {save.isPending && <Spinner />} {t('goals.form.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
