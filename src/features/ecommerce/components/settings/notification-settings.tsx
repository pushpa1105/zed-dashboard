import { useWatch, type Control } from 'react-hook-form';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import {
  notificationSettingsSchema,
  type StoreSettings,
} from '@/features/ecommerce/model/settings';
import { NumberInput } from '@/shared/components/forms/number-input';
import { SwitchRow } from '@/shared/components/forms/switch-row';
import { Input } from '@/shared/ui/input';

import { SettingsCard } from './settings-card';

const TOGGLES = [
  'orderConfirmation',
  'shippingUpdates',
  'abandonedCart',
  'lowStock',
  'dailySummary',
] as const;

export function NotificationSettings({ initial }: { initial: StoreSettings['notifications'] }) {
  const { t } = useTranslation('ecommerce', { keyPrefix: 'settings.notifications' });

  return (
    <SettingsCard section="notifications" schema={notificationSettingsSchema} initial={initial}>
      {({ control }) => (
        <>
          <FormField
            control={control}
            name="staffEmail"
            label={t('staffEmail')}
            description={t('staffEmailHint')}
            required
            render={({ field, id, invalid }) => (
              <Input id={id} type="email" aria-invalid={invalid} {...field} />
            )}
          />
          {TOGGLES.map((name) => (
            <FormField
              key={name}
              control={control}
              name={name}
              render={({ field }) => (
                <SwitchRow
                  bordered
                  label={t(name)}
                  description={t(`${name}Hint`)}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          ))}
          <LowStockThreshold control={control} />
        </>
      )}
    </SettingsCard>
  );
}

function LowStockThreshold({ control }: { control: Control<StoreSettings['notifications']> }) {
  const { t } = useTranslation('ecommerce', { keyPrefix: 'settings.notifications' });
  const enabled = useWatch({ control, name: 'lowStock' });
  if (!enabled) return null;
  return (
    <FormField
      control={control}
      name="lowStockThreshold"
      label={t('threshold')}
      description={t('thresholdHint')}
      render={({ field, id, invalid }) => (
        <NumberInput
          id={id}
          value={field.value}
          onChange={(v) => field.onChange(v ?? 1)}
          min={1}
          max={500}
          suffix={t('units')}
          invalid={invalid}
          className="max-w-48"
        />
      )}
    />
  );
}
