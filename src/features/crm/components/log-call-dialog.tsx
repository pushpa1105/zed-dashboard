import { zodResolver } from '@hookform/resolvers/zod';
import { PhoneCall } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { Combobox } from '@/shared/components/forms/combobox';
import { NumberInput } from '@/shared/components/forms/number-input';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { FieldGroup } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';

import { useLogCall, usePeople } from '../api/crm-api';
import { logCallSchema, type LogCallInput } from '../model/crm';

const OUTCOMES = ['positive', 'followUp', 'noAnswer'] as const;

export function LogCallDialog() {
  const { t } = useTranslation('crm');
  const [open, setOpen] = useState(false);
  const people = usePeople();
  const logCall = useLogCall();
  const form = useForm<LogCallInput>({
    resolver: zodResolver(logCallSchema),
    defaultValues: { with: '', title: '', durationMin: 15, outcome: 'positive' },
  });

  const submit = form.handleSubmit((values) =>
    logCall.mutate(
      {
        ...values,
        outcome: t(`meetings.form.outcomes.${values.outcome as (typeof OUTCOMES)[number]}`),
      },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset();
        },
      },
    ),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PhoneCall /> {t('meetings.logCall')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('meetings.form.title')}</DialogTitle>
          <DialogDescription>{t('meetings.form.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate>
          <FieldGroup>
            <FormField
              control={form.control}
              name="with"
              label={t('meetings.form.with')}
              required
              render={({ field, id, invalid }) => (
                <Combobox
                  id={id}
                  invalid={invalid}
                  value={field.value || null}
                  onChange={(v) => field.onChange(v ?? '')}
                  placeholder={t('meetings.form.withPlaceholder')}
                  options={(people.data ?? []).map((p) => ({
                    value: p.name,
                    label: p.name,
                    description: `${p.title} · ${p.company}`,
                  }))}
                />
              )}
            />
            <FormField
              control={form.control}
              name="title"
              label={t('meetings.form.subject')}
              required
              render={({ field, id, invalid }) => (
                <Input {...field} id={id} aria-invalid={invalid} />
              )}
            />
            <FormField
              control={form.control}
              name="durationMin"
              label={t('meetings.form.duration')}
              render={({ field, id }) => (
                <NumberInput
                  id={id}
                  value={field.value}
                  onChange={(v) => field.onChange(v ?? 0)}
                  min={1}
                  max={240}
                  step={5}
                  suffix="min"
                />
              )}
            />
            <FormField
              control={form.control}
              name="outcome"
              label={t('meetings.form.outcome')}
              render={({ field }) => (
                <SegmentedControl
                  value={field.value}
                  onChange={field.onChange}
                  options={OUTCOMES.map((o) => ({
                    value: o,
                    label: t(`meetings.form.outcomes.${o}`),
                  }))}
                />
              )}
            />
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="submit" disabled={logCall.isPending}>
              {t('meetings.form.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
