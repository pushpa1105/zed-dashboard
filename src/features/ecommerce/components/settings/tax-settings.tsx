import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, type Control } from 'react-hook-form';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { taxSettingsSchema, type StoreSettings } from '@/features/ecommerce/model/settings';
import { NumberInput } from '@/shared/components/forms/number-input';
import { SwitchRow } from '@/shared/components/forms/switch-row';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import { SettingsCard } from './settings-card';

type Taxes = StoreSettings['taxes'];

function TaxRates({ control }: { control: Control<Taxes> }) {
  const { t } = useTranslation('ecommerce', { keyPrefix: 'settings.taxes' });
  const rates = useFieldArray({ control, name: 'rates' });

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{t('rates')}</p>
      {rates.fields.map((rate, index) => (
        <div key={rate.id} className="flex items-start gap-3">
          <FormField
            control={control}
            name={`rates.${index}.region`}
            label={t('region')}
            className="flex-1"
            render={({ field, id, invalid }) => <Input id={id} aria-invalid={invalid} {...field} />}
          />
          <FormField
            control={control}
            name={`rates.${index}.rate`}
            label={t('rate')}
            className="w-28"
            render={({ field, id, invalid }) => (
              <NumberInput
                id={id}
                value={field.value}
                onChange={(v) => field.onChange(v ?? 0)}
                min={0}
                max={30}
                step={0.25}
                precision={2}
                suffix="%"
                invalid={invalid}
              />
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-6"
            aria-label={t('remove')}
            onClick={() => rates.remove(index)}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => rates.append({ id: `tax-${Date.now().toString(36)}`, region: '', rate: 0 })}
      >
        <Plus /> {t('add')}
      </Button>
    </div>
  );
}

export function TaxSettings({ initial }: { initial: Taxes }) {
  const { t } = useTranslation('ecommerce', { keyPrefix: 'settings.taxes' });

  return (
    <SettingsCard section="taxes" schema={taxSettingsSchema} initial={initial}>
      {({ control }) => (
        <>
          {(['pricesIncludeTax', 'chargeOnShipping'] as const).map((name) => (
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
          <TaxRates control={control} />
        </>
      )}
    </SettingsCard>
  );
}
