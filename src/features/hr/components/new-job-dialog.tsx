import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { TextField } from '@/core/forms/text-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { useDisclosure } from '@/shared/hooks/use-disclosure';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Spinner } from '@/shared/ui/spinner';

import { useCreateJob } from '../api/overview-api';
import { DEPARTMENTS, EMPLOYMENT_TYPES, newJobSchema, type NewJobInput } from '../model/overview';

const DEFAULTS: NewJobInput = {
  title: '',
  department: 'Engineering',
  location: '',
  type: 'fullTime',
};

export function NewJobDialog() {
  const { t } = useTranslation('hr');
  const id = useId();
  const { isOpen, setIsOpen, close } = useDisclosure();
  const form = useForm<NewJobInput>({
    resolver: zodResolver(newJobSchema),
    defaultValues: DEFAULTS,
  });
  const createJob = useCreateJob({
    onSuccess: () => {
      close();
      form.reset(DEFAULTS);
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> {t('newJob.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('newJob.title')}</DialogTitle>
          <DialogDescription>{t('newJob.description')}</DialogDescription>
        </DialogHeader>
        <form id={id} noValidate onSubmit={form.handleSubmit((values) => createJob.mutate(values))}>
          <FieldGroup>
            <TextField
              control={form.control}
              name="title"
              idPrefix={id}
              label={t('newJob.fields.title')}
              placeholder={t('newJob.placeholders.title')}
              autoFocus
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="department"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={`${id}-department`}>
                      {t('newJob.fields.department')}
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id={`${id}-department`} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((department) => (
                          <SelectItem key={department} value={department}>
                            {department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <TextField
                control={form.control}
                name="location"
                idPrefix={id}
                label={t('newJob.fields.location')}
                placeholder={t('newJob.placeholders.location')}
              />
            </div>
            <Controller
              name="type"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>{t('newJob.fields.type')}</FieldLabel>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="grid grid-cols-3 gap-2"
                  >
                    {EMPLOYMENT_TYPES.map((type) => (
                      <label
                        key={type}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm has-data-[state=checked]:border-primary has-data-[state=checked]:bg-accent"
                      >
                        <RadioGroupItem value={type} />
                        {t(`newJob.types.${type}`)}
                      </label>
                    ))}
                  </RadioGroup>
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t('newJob.cancel')}</Button>
          </DialogClose>
          <Button type="submit" form={id} disabled={createJob.isPending}>
            {createJob.isPending && <Spinner />} {t('newJob.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
