import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { Combobox } from '@/shared/components/forms/combobox';
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

import { useCreateTransfer, useItems } from '../api/inventory-api';
import { WAREHOUSE_CODES } from '../model/inventory';

import { OptionSelect } from './option-select';

const CARRIERS = ['Sierra Freight', 'UPS Freight', 'DHL Express', 'Maersk LCL', 'Own fleet'];

const schema = z
  .object({
    from: z.string().min(1, 'validation.required'),
    to: z.string().min(1, 'validation.required'),
    carrier: z.string().min(1, 'validation.required'),
    lines: z
      .array(
        z.object({
          sku: z.string().min(1, 'validation.required'),
          quantity: z.number().int().min(1, 'inventory:transfers.create.errors.quantity'),
        }),
      )
      .min(1),
  })
  .refine((v) => v.from !== v.to, {
    message: 'inventory:transfers.create.errors.sameWarehouse',
    path: ['to'],
  });
type Values = z.infer<typeof schema>;

/** New stock transfer between warehouses with any number of item lines. */
export function CreateTransferDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation('inventory', { keyPrefix: 'transfers.create' });
  const items = useItems('RNO');
  const create = useCreateTransfer();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      from: 'RNO',
      to: 'DFW',
      carrier: CARRIERS[0],
      lines: [{ sku: '', quantity: 10 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lines' });
  const options = (items.data ?? []).map((i) => ({
    value: i.sku,
    label: i.name,
    description: `${i.sku} · ${i.available} available`,
  }));

  const warehouseSelect = (name: 'from' | 'to') => (
    <FormField
      control={form.control}
      name={name}
      label={t(name)}
      render={({ field, id, invalid }) => (
        <OptionSelect
          id={id}
          value={field.value}
          onChange={field.onChange}
          invalid={invalid}
          options={WAREHOUSE_CODES.map((code) => ({ value: code, label: code }))}
        />
      )}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <form
          id="create-transfer"
          noValidate
          className="grid gap-5"
          onSubmit={form.handleSubmit((values) =>
            create.mutate(values, {
              onSuccess: (transfer) => {
                notify.success(t('created', { id: transfer.id }));
                form.reset();
                onOpenChange(false);
              },
            }),
          )}
        >
          <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr_1fr]">
            {warehouseSelect('from')}
            <ArrowRight className="mb-2.5 hidden size-4 text-muted-foreground sm:block" />
            {warehouseSelect('to')}
            <FormField
              control={form.control}
              name="carrier"
              label={t('carrier')}
              render={({ field, id }) => (
                <OptionSelect
                  id={id}
                  value={field.value}
                  onChange={field.onChange}
                  options={CARRIERS.map((c) => ({ value: c, label: c }))}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{t('lines')}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => append({ sku: '', quantity: 10 })}
              >
                <Plus /> {t('addLine')}
              </Button>
            </div>
            <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
              {fields.map((row, index) => (
                <div key={row.id} className="grid grid-cols-[1fr_8rem_auto] items-start gap-2">
                  <FormField
                    control={form.control}
                    name={`lines.${index}.sku`}
                    render={({ field, invalid }) => (
                      <Combobox
                        options={options}
                        value={field.value || null}
                        onChange={(v) => field.onChange(v ?? '')}
                        placeholder={t('item')}
                        searchPlaceholder={t('search')}
                        invalid={invalid}
                        className="w-full"
                      />
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`lines.${index}.quantity`}
                    render={({ field, invalid }) => (
                      <NumberInput
                        aria-label={t('quantity')}
                        value={field.value}
                        onChange={(v) => field.onChange(v ?? 0)}
                        min={1}
                        invalid={invalid}
                      />
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t('removeLine')}
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button type="submit" form="create-transfer" disabled={create.isPending}>
            {t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
