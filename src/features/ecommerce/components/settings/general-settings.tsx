import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import {
  CURRENCIES,
  generalSettingsSchema,
  TIMEZONES,
  type StoreSettings,
} from '@/features/ecommerce/model/settings';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { SettingsCard } from './settings-card';

function OptionSelect<T extends string>({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly T[];
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option.replace('_', ' ')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function GeneralSettings({ initial }: { initial: StoreSettings['general'] }) {
  const { t } = useTranslation('ecommerce', { keyPrefix: 'settings.general' });

  return (
    <SettingsCard section="general" schema={generalSettingsSchema} initial={initial}>
      {({ control }) => (
        <>
          <FormField
            control={control}
            name="storeName"
            label={t('storeName')}
            required
            render={({ field, id, invalid }) => <Input id={id} aria-invalid={invalid} {...field} />}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="contactEmail"
              label={t('contactEmail')}
              description={t('contactEmailHint')}
              required
              render={({ field, id, invalid }) => (
                <Input id={id} type="email" aria-invalid={invalid} {...field} />
              )}
            />
            <FormField
              control={control}
              name="phone"
              label={t('phone')}
              render={({ field, id, invalid }) => (
                <Input id={id} type="tel" aria-invalid={invalid} {...field} />
              )}
            />
            <FormField
              control={control}
              name="currency"
              label={t('currency')}
              render={({ field, id }) => (
                <OptionSelect
                  id={id}
                  value={field.value}
                  onChange={field.onChange}
                  options={CURRENCIES}
                />
              )}
            />
            <FormField
              control={control}
              name="timezone"
              label={t('timezone')}
              render={({ field, id }) => (
                <OptionSelect
                  id={id}
                  value={field.value}
                  onChange={field.onChange}
                  options={TIMEZONES}
                />
              )}
            />
            <FormField
              control={control}
              name="weightUnit"
              label={t('weightUnit')}
              render={({ field }) => (
                <SegmentedControl
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'kg', label: t('kg') },
                    { value: 'lb', label: t('lb') },
                  ]}
                />
              )}
            />
            <FormField
              control={control}
              name="orderPrefix"
              label={t('orderPrefix')}
              description={t('orderPrefixHint')}
              render={({ field, id, invalid }) => (
                <Input id={id} aria-invalid={invalid} className="max-w-32 font-mono" {...field} />
              )}
            />
          </div>
        </>
      )}
    </SettingsCard>
  );
}
