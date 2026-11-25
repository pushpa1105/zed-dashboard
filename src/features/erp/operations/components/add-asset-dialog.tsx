import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { DatePicker } from '@/shared/components/forms/date-picker';
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
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { useCreateAsset } from '../api/operations-api';
import { ASSET_CATEGORIES, DEPRECIATION_METHODS } from '../model/operations';

const assetFormSchema = z
  .object({
    name: z.string().trim().min(1, 'validation.required').max(80, 'validation.tooLong'),
    category: z.enum(ASSET_CATEGORIES),
    location: z.string().trim().min(1, 'validation.required').max(40, 'validation.tooLong'),
    acquired: z.date({ message: 'validation.required' }),
    cost: z.number().positive('erp:assets.form.errors.cost'),
    salvage: z.number().min(0),
    usefulLife: z
      .number()
      .int()
      .min(1, 'erp:assets.form.errors.life')
      .max(50, 'erp:assets.form.errors.life'),
    method: z.enum(DEPRECIATION_METHODS),
  })
  .refine((v) => v.salvage < v.cost, {
    message: 'erp:assets.form.errors.salvage',
    path: ['salvage'],
  });

type AssetForm = z.infer<typeof assetFormSchema>;

const defaults: AssetForm = {
  name: '',
  category: 'machinery',
  location: 'Reno HQ',
  acquired: new Date(),
  cost: 0,
  salvage: 0,
  usefulLife: 5,
  method: 'straight-line',
};

/** Registers a new fixed asset; the API computes its depreciation schedule. */
export function AddAssetDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation('erp', { keyPrefix: 'assets' });
  const create = useCreateAsset();
  const form = useForm<AssetForm>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: defaults,
  });

  const submit = form.handleSubmit(({ acquired, ...values }) =>
    create.mutate(
      { ...values, acquired: acquired.toISOString().slice(0, 10) },
      {
        onSuccess: () => {
          form.reset(defaults);
          onOpenChange(false);
        },
      },
    ),
  );

  const currencyField = (name: 'cost' | 'salvage', label: string) => (
    <FormField
      control={form.control}
      name={name}
      label={label}
      required={name === 'cost'}
      render={({ field, id, invalid }) => (
        <NumberInput
          id={id}
          value={field.value}
          onChange={(value) => field.onChange(value ?? 0)}
          min={0}
          precision={2}
          format="currency"
          invalid={invalid}
        />
      )}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('form.title')}</DialogTitle>
          <DialogDescription>{t('form.description')}</DialogDescription>
        </DialogHeader>
        <form
          id="add-asset"
          noValidate
          onSubmit={(e) => void submit(e)}
          className="grid gap-4 sm:grid-cols-2"
        >
          <FormField
            control={form.control}
            name="name"
            label={t('form.name')}
            required
            className="sm:col-span-2"
            render={({ field, id, invalid }) => (
              <Input
                id={id}
                {...field}
                aria-invalid={invalid}
                placeholder={t('form.namePlaceholder')}
              />
            )}
          />
          <FormField
            control={form.control}
            name="category"
            label={t('form.category')}
            render={({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`categories.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            label={t('form.location')}
            required
            render={({ field, id, invalid }) => <Input id={id} {...field} aria-invalid={invalid} />}
          />
          <FormField
            control={form.control}
            name="acquired"
            label={t('form.acquired')}
            required
            render={({ field, id, invalid }) => (
              <DatePicker
                id={id}
                value={field.value}
                onChange={(value) => field.onChange(value ?? undefined)}
                invalid={invalid}
              />
            )}
          />
          <FormField
            control={form.control}
            name="usefulLife"
            label={t('form.usefulLife')}
            required
            render={({ field, id, invalid }) => (
              <NumberInput
                id={id}
                value={field.value}
                onChange={(value) => field.onChange(value ?? 0)}
                min={1}
                max={50}
                suffix={t('form.years')}
                invalid={invalid}
              />
            )}
          />
          {currencyField('cost', t('form.cost'))}
          {currencyField('salvage', t('form.salvage'))}
          <FormField
            control={form.control}
            name="method"
            label={t('form.method')}
            className="sm:col-span-2"
            render={({ field }) => (
              <SegmentedControl
                block
                aria-label={t('form.method')}
                value={field.value}
                onChange={field.onChange}
                options={DEPRECIATION_METHODS.map((m) => ({ value: m, label: t(`methods.${m}`) }))}
              />
            )}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('form.cancel')}
          </Button>
          <Button type="submit" form="add-asset" disabled={create.isPending}>
            {t('form.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
