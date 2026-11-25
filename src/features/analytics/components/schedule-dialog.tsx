import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { TagInput } from '@/shared/components/forms/tag-input';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { Spinner } from '@/shared/ui/spinner';

import { useScheduleReport } from '../api/analytics-api';
import {
  FORMATS,
  FREQUENCIES,
  scheduleSchema,
  type Report,
  type Schedule,
} from '../model/analytics';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sets or changes when a saved report is emailed, and to whom. */
export function ScheduleDialog({
  report,
  onClose,
}: {
  report: Report | null;
  onClose: () => void;
}) {
  const { t } = useTranslation('analytics');
  const schedule = useScheduleReport();
  const form = useForm<Schedule>({
    resolver: zodResolver(scheduleSchema),
    values: report?.schedule ?? { frequency: 'weekly', recipients: [], format: 'pdf' },
  });

  return (
    <Dialog open={!!report} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('reports.schedule.title')}</DialogTitle>
          <DialogDescription>{report?.name}</DialogDescription>
        </DialogHeader>
        <form
          id="schedule-form"
          noValidate
          className="space-y-5"
          onSubmit={form.handleSubmit((values) =>
            schedule.mutate({ id: report!.id, schedule: values }, { onSuccess: onClose }),
          )}
        >
          <FormField
            control={form.control}
            name="frequency"
            label={t('reports.schedule.frequency')}
            render={({ field }) => (
              <SegmentedControl
                block
                value={field.value}
                onChange={field.onChange}
                options={FREQUENCIES.map((value) => ({
                  value,
                  label: t(`reports.frequency.${value}`),
                }))}
              />
            )}
          />
          <FormField
            control={form.control}
            name="recipients"
            label={t('reports.schedule.recipients')}
            description={t('reports.schedule.recipientsHint')}
            render={({ field, id, invalid }) => (
              <TagInput
                id={id}
                value={field.value}
                onChange={field.onChange}
                invalid={invalid}
                lowercase
                max={10}
                placeholder="name@company.com"
                validate={(tag) =>
                  EMAIL.test(tag) ? undefined : t('reports.schedule.invalidEmail')
                }
              />
            )}
          />
          <FormField
            control={form.control}
            name="format"
            label={t('reports.schedule.format')}
            render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-6">
                {FORMATS.map((format) => (
                  <Label key={format} className="flex items-center gap-2 font-normal">
                    <RadioGroupItem value={format} />
                    {t(`reports.format.${format}`)}
                  </Label>
                ))}
              </RadioGroup>
            )}
          />
        </form>
        <DialogFooter className="sm:justify-between">
          {report?.schedule ? (
            <Button
              variant="ghost"
              className="text-destructive"
              disabled={schedule.isPending}
              onClick={() =>
                schedule.mutate({ id: report.id, schedule: null }, { onSuccess: onClose })
              }
            >
              {t('reports.schedule.stop')}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              {t('reports.schedule.cancel')}
            </Button>
            <Button type="submit" form="schedule-form" disabled={schedule.isPending}>
              {schedule.isPending && <Spinner />} {t('reports.schedule.save')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
