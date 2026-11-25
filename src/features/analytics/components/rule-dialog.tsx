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

import { useCreateRule } from '../api/insights-api';
import {
  ALERT_METRICS,
  alertRuleInputSchema,
  CONDITIONS,
  NOTIFY_CHANNELS,
  SEVERITIES,
  WINDOWS,
  type AlertRuleInput,
} from '../model/insights';

const DEFAULTS: AlertRuleInput = {
  name: '',
  metric: 'sessions',
  condition: 'drops',
  threshold: 25,
  window: '24h',
  severity: 'warning',
  notify: 'email',
};

/** Creates an alert rule: which metric to watch, how far it may deviate and who hears about it. */
export function RuleDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation('analytics');
  const create = useCreateRule();
  const form = useForm<AlertRuleInput>({
    resolver: zodResolver(alertRuleInputSchema),
    defaultValues: DEFAULTS,
  });
  const selects = [
    {
      name: 'metric',
      options: ALERT_METRICS.map((value) => ({ value, label: t(`alerts.metrics.${value}`) })),
    },
    {
      name: 'condition',
      options: CONDITIONS.map((value) => ({ value, label: t(`alerts.conditions.${value}`) })),
    },
    {
      name: 'window',
      options: WINDOWS.map((value) => ({ value, label: t(`alerts.windows.${value}`) })),
    },
    {
      name: 'severity',
      options: SEVERITIES.map((value) => ({ value, label: t(`alerts.severity.${value}`) })),
    },
    {
      name: 'notify',
      options: NOTIFY_CHANNELS.map((value) => ({ value, label: t(`alerts.notify.${value}`) })),
    },
  ] as const;
  const close = () => {
    form.reset(DEFAULTS);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('alerts.form.title')}</DialogTitle>
          <DialogDescription>{t('alerts.form.description')}</DialogDescription>
        </DialogHeader>
        <form
          id="alert-rule-form"
          noValidate
          className="grid gap-5 sm:grid-cols-2"
          onSubmit={form.handleSubmit((input) => create.mutate(input, { onSuccess: close }))}
        >
          <FormField
            control={form.control}
            name="name"
            label={t('alerts.form.name')}
            required
            className="sm:col-span-2"
            render={({ field, id, invalid }) => (
              <Input
                id={id}
                {...field}
                aria-invalid={invalid}
                placeholder={t('alerts.form.namePlaceholder')}
              />
            )}
          />
          {selects.map(({ name, options }) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              label={t(`alerts.form.${name}`)}
              render={({ field, id }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id={id} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          ))}
          <FormField
            control={form.control}
            name="threshold"
            label={t('alerts.form.threshold')}
            description={t('alerts.form.thresholdHint')}
            required
            render={({ field, id, invalid }) => (
              <NumberInput
                id={id}
                value={field.value}
                onChange={(v) => field.onChange(v ?? 0)}
                invalid={invalid}
                min={1}
                max={500}
                suffix="%"
              />
            )}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            {t('alerts.form.cancel')}
          </Button>
          <Button type="submit" form="alert-rule-form" disabled={create.isPending}>
            {create.isPending && <Spinner />} {t('alerts.form.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
