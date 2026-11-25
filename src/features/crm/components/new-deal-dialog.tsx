import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useState, type ReactNode } from 'react';
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
  DialogTrigger,
} from '@/shared/ui/dialog';
import { FieldGroup } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { useCompanies, useCreateDeal } from '../api/crm-api';
import { newDealSchema, OPEN_STAGES, type NewDealInput } from '../model/crm';

/** Quick-add form for a deal. `trigger` replaces the default button. */
export function NewDealDialog({
  defaultStage = 'lead',
  trigger,
}: {
  defaultStage?: NewDealInput['stage'];
  trigger?: ReactNode;
}) {
  const { t } = useTranslation('crm');
  const [open, setOpen] = useState(false);
  const companies = useCompanies();
  const create = useCreateDeal();
  const form = useForm<NewDealInput>({
    resolver: zodResolver(newDealSchema),
    defaultValues: { name: '', company: '', value: 25_000, stage: defaultStage },
  });

  const submit = form.handleSubmit((values) =>
    create.mutate(values, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    }),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus /> {t('pipeline.addDeal')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('quickAdd.title')}</DialogTitle>
          <DialogDescription>{t('quickAdd.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate>
          <FieldGroup>
            <FormField
              control={form.control}
              name="name"
              label={t('quickAdd.name')}
              required
              render={({ field, id, invalid }) => (
                <Input
                  {...field}
                  id={id}
                  aria-invalid={invalid}
                  placeholder={t('quickAdd.namePlaceholder')}
                />
              )}
            />
            <FormField
              control={form.control}
              name="company"
              label={t('quickAdd.company')}
              required
              render={({ field, id, invalid }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id={id} aria-invalid={invalid} className="w-full">
                    <SelectValue placeholder={t('quickAdd.companyPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.data?.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="value"
                label={t('quickAdd.value')}
                render={({ field, id, invalid }) => (
                  <NumberInput
                    id={id}
                    invalid={invalid}
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? 0)}
                    min={0}
                    step={1000}
                    format="currency"
                  />
                )}
              />
              <FormField
                control={form.control}
                name="stage"
                label={t('quickAdd.stage')}
                render={({ field, id }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={id} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPEN_STAGES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`stages.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('quickAdd.cancel')}
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {t('quickAdd.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
