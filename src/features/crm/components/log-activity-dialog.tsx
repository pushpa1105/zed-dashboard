import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { Combobox } from '@/shared/components/forms/combobox';
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
import { Textarea } from '@/shared/ui/textarea';

import { useLogActivity } from '../api/activity-api';
import { useDeals } from '../api/crm-api';
import { LOGGABLE_TYPES, logActivitySchema, type LogActivityInput } from '../model/activity';

const BLANK: LogActivityInput = { type: 'call', dealId: '', title: '', detail: '' };

export function LogActivityDialog() {
  const { t } = useTranslation('crm');
  const [open, setOpen] = useState(false);
  const deals = useDeals();
  const log = useLogActivity();
  const form = useForm<LogActivityInput>({
    resolver: zodResolver(logActivitySchema),
    defaultValues: BLANK,
  });

  const submit = form.handleSubmit((values) =>
    log.mutate(values, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    }),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> {t('activity.log')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('activity.form.title')}</DialogTitle>
          <DialogDescription>{t('activity.form.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate>
          <FieldGroup>
            <FormField
              control={form.control}
              name="type"
              label={t('activity.form.type')}
              render={({ field }) => (
                <SegmentedControl
                  block
                  value={field.value}
                  onChange={field.onChange}
                  options={LOGGABLE_TYPES.map((type) => ({
                    value: type,
                    label: t(`activity.types.${type}`),
                  }))}
                />
              )}
            />
            <FormField
              control={form.control}
              name="dealId"
              label={t('activity.form.deal')}
              required
              render={({ field, id, invalid }) => (
                <Combobox
                  id={id}
                  invalid={invalid}
                  value={field.value || null}
                  onChange={(v) => field.onChange(v ?? '')}
                  placeholder={t('activity.form.dealPlaceholder')}
                  options={(deals.data ?? []).map((d) => ({
                    value: d.id,
                    label: d.name,
                    description: d.company,
                  }))}
                />
              )}
            />
            <FormField
              control={form.control}
              name="title"
              label={t('activity.form.summary')}
              required
              render={({ field, id, invalid }) => (
                <Input {...field} id={id} aria-invalid={invalid} />
              )}
            />
            <FormField
              control={form.control}
              name="detail"
              label={t('activity.form.detail')}
              render={({ field, id, invalid }) => (
                <Textarea {...field} id={id} aria-invalid={invalid} className="min-h-24" />
              )}
            />
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="submit" disabled={log.isPending}>
              {t('activity.form.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
