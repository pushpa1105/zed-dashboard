import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarPlus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { DateTimePicker } from '@/shared/components/forms/date-time-picker';
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
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Spinner } from '@/shared/ui/spinner';

import { useScheduleLive } from '../api/teaching-api';
import { minutes } from '../lib/format';
import { LIVE_DURATIONS, liveInputSchema, type LiveInput } from '../model/teaching';

type Course = { id: string; title: string };

/** Tomorrow at 10:00, a sensible default slot. */
const tomorrowMorning = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
};

/** Schedules a new live class for one of the courses. */
export function ScheduleLiveDialog({ courses }: { courses: Course[] }) {
  const { t } = useTranslation(['academy', 'common']);
  const [open, setOpen] = useState(false);
  const schedule = useScheduleLive();
  const form = useForm<LiveInput>({
    resolver: zodResolver(liveInputSchema),
    defaultValues: {
      title: '',
      courseId: courses[0]?.id ?? '',
      startsAt: tomorrowMorning(),
      durationMin: 60,
      capacity: 100,
    },
  });
  const close = () => {
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <DialogTrigger asChild>
        <Button>
          <CalendarPlus /> {t('live.schedule')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('live.form.title')}</DialogTitle>
          <DialogDescription>{t('live.form.description')}</DialogDescription>
        </DialogHeader>
        <form
          id="live-form"
          noValidate
          className="space-y-5"
          onSubmit={form.handleSubmit((values) => schedule.mutate(values, { onSuccess: close }))}
        >
          <FormField
            control={form.control}
            name="title"
            label={t('live.form.name')}
            required
            render={({ field, id, invalid }) => (
              <Input
                id={id}
                aria-invalid={invalid}
                placeholder={t('live.form.namePlaceholder')}
                autoComplete="off"
                {...field}
              />
            )}
          />
          <FormField
            control={form.control}
            name="courseId"
            label={t('live.form.course')}
            render={({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FormField
            control={form.control}
            name="startsAt"
            label={t('live.form.startsAt')}
            render={({ field, id, invalid }) => (
              <DateTimePicker
                id={id}
                value={field.value}
                onChange={field.onChange}
                step={15}
                invalid={invalid}
              />
            )}
          />
          <FormField
            control={form.control}
            name="durationMin"
            label={t('live.form.duration')}
            render={({ field }) => (
              <SegmentedControl
                block
                value={String(field.value)}
                onChange={(value) => field.onChange(Number(value))}
                options={LIVE_DURATIONS.map((d) => ({ value: String(d), label: minutes(d) }))}
              />
            )}
          />
          <FormField
            control={form.control}
            name="capacity"
            label={t('live.form.capacity')}
            description={t('live.form.capacityHint')}
            render={({ field, id, invalid }) => (
              <NumberInput
                id={id}
                value={field.value}
                onChange={field.onChange}
                min={5}
                max={500}
                step={5}
                invalid={invalid}
              />
            )}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            {t('common:actions.cancel')}
          </Button>
          <Button type="submit" form="live-form" disabled={schedule.isPending}>
            {schedule.isPending && <Spinner />} {t('live.schedule')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
