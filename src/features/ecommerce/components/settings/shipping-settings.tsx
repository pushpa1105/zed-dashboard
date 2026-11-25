import { Globe2, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, type Control } from 'react-hook-form';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { shippingSettingsSchema, type StoreSettings } from '@/features/ecommerce/model/settings';
import { CurrencyInput } from '@/shared/components/forms/currency-input';
import { TagInput } from '@/shared/components/forms/tag-input';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import { SettingsCard } from './settings-card';

type Shipping = StoreSettings['shipping'];
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;

function ZoneRates({ control, zone }: { control: Control<Shipping>; zone: number }) {
  const { t } = useTranslation('ecommerce', { keyPrefix: 'settings.shipping' });
  const rates = useFieldArray({ control, name: `zones.${zone}.rates` });

  return (
    <div className="space-y-3">
      {rates.fields.map((rate, index) => (
        <div key={rate.id} className="grid items-start gap-3 sm:grid-cols-[1fr_8rem_8rem_auto]">
          <FormField
            control={control}
            name={`zones.${zone}.rates.${index}.name`}
            label={t('rateName')}
            render={({ field, id, invalid }) => <Input id={id} aria-invalid={invalid} {...field} />}
          />
          <FormField
            control={control}
            name={`zones.${zone}.rates.${index}.price`}
            label={t('price')}
            render={({ field, id, invalid }) => (
              <CurrencyInput
                id={id}
                value={field.value}
                onChange={(v) => field.onChange(v ?? 0)}
                invalid={invalid}
              />
            )}
          />
          <FormField
            control={control}
            name={`zones.${zone}.rates.${index}.freeOver`}
            label={t('freeOver')}
            render={({ field, id, invalid }) => (
              <CurrencyInput
                id={id}
                value={field.value}
                onChange={field.onChange}
                placeholder={t('never')}
                invalid={invalid}
              />
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="sm:mt-6"
            aria-label={t('removeRate')}
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
        onClick={() => rates.append({ id: newId('rate'), name: '', price: 0, freeOver: null })}
      >
        <Plus /> {t('addRate')}
      </Button>
    </div>
  );
}

function ShippingZones({ control }: { control: Control<Shipping> }) {
  const { t } = useTranslation('ecommerce', { keyPrefix: 'settings.shipping' });
  const zones = useFieldArray({ control, name: 'zones' });
  return (
    <>
      {zones.fields.map((zone, index) => (
        <fieldset key={zone.id} className="space-y-4 rounded-lg border p-4">
          <legend className="flex items-center gap-2 px-1 text-sm font-medium">
            <Globe2 className="size-4 text-muted-foreground" />
            {t('zone', { index: index + 1 })}
          </legend>
          <div className="flex items-start gap-3">
            <FormField
              control={control}
              name={`zones.${index}.name`}
              label={t('zoneName')}
              className="flex-1"
              render={({ field, id, invalid }) => (
                <Input id={id} aria-invalid={invalid} {...field} />
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-6"
              aria-label={t('removeZone')}
              onClick={() => zones.remove(index)}
            >
              <Trash2 />
            </Button>
          </div>
          <FormField
            control={control}
            name={`zones.${index}.countries`}
            label={t('countries')}
            description={t('countriesHint')}
            render={({ field, id, invalid }) => (
              <TagInput id={id} value={field.value} onChange={field.onChange} invalid={invalid} />
            )}
          />
          <ZoneRates control={control} zone={index} />
        </fieldset>
      ))}
      <Button
        type="button"
        variant="outline"
        className="self-start"
        onClick={() =>
          zones.append({
            id: newId('zone'),
            name: '',
            countries: [],
            rates: [{ id: newId('rate'), name: t('standard'), price: 0, freeOver: null }],
          })
        }
      >
        <Plus /> {t('addZone')}
      </Button>
    </>
  );
}

export function ShippingSettings({ initial }: { initial: Shipping }) {
  return (
    <SettingsCard section="shipping" schema={shippingSettingsSchema} initial={initial}>
      {(form) => <ShippingZones control={form.control} />}
    </SettingsCard>
  );
}
