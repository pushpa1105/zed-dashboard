import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useId } from 'react';
import { useForm } from 'react-hook-form';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { DatePicker } from '@/shared/components/forms/date-picker';
import { MultiSelect } from '@/shared/components/forms/multi-select';
import { useDisclosure } from '@/shared/hooks/use-disclosure';
import { formatDate } from '@/shared/lib/format';
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
import { FieldGroup } from '@/shared/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Spinner } from '@/shared/ui/spinner';

import { useEmployees } from '../api/hr-api';
import { useAssignTraining } from '../api/people-ops-api';
import { assignTrainingSchema, type AssignTrainingInput, type Course } from '../model/training';

const blank = (): AssignTrainingInput => ({
  courseId: '',
  personIds: [],
  due: new Date(Date.now() + 14 * 86_400_000),
});

export function AssignTrainingDialog({ courses }: { courses: Course[] }) {
  const { t } = useTranslation('hr');
  const id = useId();
  const { isOpen, setIsOpen, close } = useDisclosure();
  const employees = useEmployees();
  const assign = useAssignTraining();
  const form = useForm<AssignTrainingInput>({
    resolver: zodResolver(assignTrainingSchema),
    defaultValues: blank(),
  });

  const submit = form.handleSubmit(({ due, ...values }) =>
    assign.mutate(
      { ...values, due: formatDate(due, 'YYYY-MM-DD') },
      {
        onSuccess: () => {
          close();
          form.reset(blank());
        },
      },
    ),
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button disabled={!courses.length}>
          <Plus /> {t('training.assign.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('training.assign.title')}</DialogTitle>
          <DialogDescription>{t('training.assign.description')}</DialogDescription>
        </DialogHeader>
        <form id={id} noValidate onSubmit={submit}>
          <FieldGroup>
            <FormField
              control={form.control}
              name="courseId"
              label={t('training.assign.course')}
              required
              render={({ field, id: fieldId, invalid }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id={fieldId} aria-invalid={invalid} className="w-full">
                    <SelectValue placeholder={t('training.assign.coursePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FormField
              control={form.control}
              name="personIds"
              label={t('training.assign.people')}
              required
              render={({ field, id: fieldId, invalid }) => (
                <MultiSelect
                  id={fieldId}
                  invalid={invalid}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('training.assign.peoplePlaceholder')}
                  options={(employees.data ?? []).map((p) => ({
                    value: p.id,
                    label: p.name,
                    description: p.department,
                  }))}
                />
              )}
            />
            <FormField
              control={form.control}
              name="due"
              label={t('training.assign.due')}
              required
              render={({ field, id: fieldId, invalid }) => (
                <DatePicker
                  id={fieldId}
                  invalid={invalid}
                  value={field.value}
                  onChange={(d) => field.onChange(d ?? undefined)}
                  disabledDays={{ before: new Date() }}
                />
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t('training.assign.cancel')}</Button>
          </DialogClose>
          <Button type="submit" form={id} disabled={assign.isPending}>
            {assign.isPending && <Spinner />} {t('training.assign.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
