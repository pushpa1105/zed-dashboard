import type { UseFormReturn } from 'react-hook-form';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { Combobox } from '@/shared/components/forms/combobox';
import { TextareaWithCounter } from '@/shared/components/forms/textarea-with-counter';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Spinner } from '@/shared/ui/spinner';
import { Switch } from '@/shared/ui/switch';

import { ROLES, TIMEZONES, type AccountFieldName, type AccountValues } from './account-model';

type AccountFieldProps = {
  form: UseFormReturn<AccountValues>;
  name: AccountFieldName;
  orientation?: 'vertical' | 'horizontal';
  /** Hide the visible label (inline layouts); it stays as the accessible name. */
  compact?: boolean;
  className?: string;
};

/** Renders one field of the shared Account form with the right control. */
export function AccountField({ form, name, orientation, compact, className }: AccountFieldProps) {
  const { t } = useTranslation('ui-forms');
  const label = t(`layouts.fields.${name}`);
  const description =
    compact || !['email', 'timezone', 'bio', 'newsletter'].includes(name)
      ? undefined
      : t(`layouts.hints.${name as 'email' | 'timezone' | 'bio' | 'newsletter'}`);

  return (
    <FormField
      control={form.control}
      name={name}
      label={compact ? undefined : label}
      description={description}
      orientation={orientation}
      required={!compact && ['firstName', 'lastName', 'email'].includes(name)}
      className={className}
      render={({ field, id, invalid }) => {
        switch (name) {
          case 'role':
            return (
              <Select value={field.value as string} onValueChange={field.onChange}>
                <SelectTrigger id={id} aria-label={label} aria-invalid={invalid} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {t(`layouts.roles.${role}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          case 'timezone':
            return (
              <Combobox
                id={id}
                options={TIMEZONES}
                value={field.value as string}
                onChange={(v) => field.onChange(v ?? '')}
                invalid={invalid}
                searchPlaceholder={t('layouts.searchTimezone')}
              />
            );
          case 'bio':
            return (
              <TextareaWithCounter
                id={id}
                aria-label={label}
                maxLength={160}
                rows={3}
                placeholder={t('layouts.bioPlaceholder')}
                aria-invalid={invalid}
                {...field}
                value={field.value as string}
              />
            );
          case 'newsletter':
            return (
              <Switch
                id={id}
                aria-label={label}
                checked={field.value as boolean}
                onCheckedChange={field.onChange}
              />
            );
          default:
            return (
              <Input
                id={id}
                aria-label={label}
                placeholder={compact ? label : undefined}
                type={name === 'email' ? 'email' : 'text'}
                autoComplete={
                  name === 'email' ? 'email' : name === 'firstName' ? 'given-name' : 'family-name'
                }
                aria-invalid={invalid}
                {...field}
                value={field.value as string}
              />
            );
        }
      }}
    />
  );
}

/** Save / reset buttons shared by the layouts. */
export function AccountActions({
  form,
  pending,
  onCancel,
  align = 'end',
}: {
  form: UseFormReturn<AccountValues>;
  pending: boolean;
  onCancel?: () => void;
  align?: 'start' | 'end' | 'stretch';
}) {
  const { t } = useTranslation('ui-forms');
  return (
    <div
      className={
        align === 'stretch'
          ? 'grid grid-cols-2 gap-2'
          : `flex gap-2 ${align === 'end' ? 'justify-end' : 'justify-start'}`
      }
    >
      <Button
        type="button"
        variant="outline"
        onClick={() => (onCancel ? onCancel() : form.reset())}
        disabled={pending}
      >
        {onCancel ? t('layouts.cancel') : t('layouts.reset')}
      </Button>
      <Button type="submit" disabled={pending}>
        {pending && <Spinner />} {t('layouts.save')}
      </Button>
    </div>
  );
}
