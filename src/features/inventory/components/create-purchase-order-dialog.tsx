import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { Combobox } from '@/shared/components/forms/combobox';
import { DatePicker } from '@/shared/components/forms/date-picker';
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

import { useCreatePurchaseOrders, useItems, useSuppliers } from '../api/inventory-api';
import { inDays, isoDate, usdCents } from '../lib/format';
import { WAREHOUSE_CODES, type PurchaseOrderInput } from '../model/inventory';

import { OptionSelect } from './option-select';

const schema = z
  .object({
    supplierId: z.string().min(1, 'validation.required'),
    warehouse: z.string().min(1, 'validation.required'),
    expected: z.date({ message: 'validation.required' }),
    lines: z
      .array(
        z.object({
          sku: z.string().min(1, 'validation.required'),
          quantity: z.number().int().min(1, 'inventory:purchaseOrders.create.errors.quantity'),
          unitCost: z.number().positive('inventory:purchaseOrders.create.errors.cost'),
        }),
      )
      .min(1),
  })
  .superRefine(({ lines }, ctx) =>
    lines.forEach((line, i) => {
      if (line.sku && lines.findIndex((l) => l.sku === line.sku) !== i) {
        ctx.addIssue({
          code: 'custom',
          path: ['lines', i, 'sku'],
          message: 'inventory:purchaseOrders.create.errors.duplicate',
        });
      }
    }),
  );
type Values = z.infer<typeof schema>;

const emptyLine = { sku: '', quantity: 10, unitCost: 0 };

function PurchaseOrderForm({ supplierId, onDone }: { supplierId?: string; onDone: () => void }) {
  const { t } = useTranslation('inventory', { keyPrefix: 'purchaseOrders.create' });
  const suppliers = useSuppliers();
  const items = useItems();
  const create = useCreatePurchaseOrders();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      supplierId: supplierId ?? '',
      warehouse: 'RNO',
      expected: inDays(14),
      lines: [emptyLine],
    },
  });
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'lines',
  });
  const [selectedSupplier, lines] = useWatch({
    control: form.control,
    name: ['supplierId', 'lines'],
  });
  const supplier = suppliers.data?.find((s) => s.id === selectedSupplier);
  const catalog = (items.data ?? []).filter((i) => i.supplier === supplier?.name);
  const options = catalog.map((i) => ({
    value: i.sku,
    label: i.name,
    description: `${i.sku} · ${usdCents(i.unitCost)}`,
  }));
  const total = lines.reduce((s, l) => s + (l.quantity || 0) * (l.unitCost || 0), 0);

  const submit = (status: PurchaseOrderInput['status']) =>
    form.handleSubmit((values) =>
      create.mutate([{ ...values, expected: isoDate(values.expected), status }], {
        onSuccess: ([po]) => {
          notify.success(t('created', { id: po!.id }));
          onDone();
        },
      }),
    );

  return (
    <>
      <form id="create-po" noValidate className="grid gap-5" onSubmit={submit('sent')}>
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1.4fr]">
          <FormField
            control={form.control}
            name="supplierId"
            label={t('supplier')}
            render={({ field, id, invalid }) => (
              <OptionSelect
                id={id}
                invalid={invalid}
                value={field.value}
                options={(suppliers.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
                onChange={(value) => {
                  field.onChange(value);
                  const lead = suppliers.data?.find((s) => s.id === value)?.leadTimeDays ?? 0;
                  form.setValue('expected', inDays(lead));
                  replace([emptyLine]);
                }}
              />
            )}
          />
          <FormField
            control={form.control}
            name="warehouse"
            label={t('warehouse')}
            render={({ field, id }) => (
              <OptionSelect
                id={id}
                value={field.value}
                onChange={field.onChange}
                options={WAREHOUSE_CODES.map((code) => ({ value: code, label: code }))}
              />
            )}
          />
          <FormField
            control={form.control}
            name="expected"
            label={t('expected')}
            render={({ field, id, invalid }) => (
              <DatePicker
                id={id}
                value={field.value}
                onChange={(d) => field.onChange(d ?? undefined)}
                disabledDays={{ before: new Date() }}
                invalid={invalid}
              />
            )}
          />
        </div>

        <fieldset className="space-y-2">
          <div className="flex items-center justify-between">
            <legend className="text-sm font-medium">{t('lines')}</legend>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!supplier}
              onClick={() => append(emptyLine)}
            >
              <Plus /> {t('addLine')}
            </Button>
          </div>
          <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
            {fields.map((row, index) => (
              <div
                key={row.id}
                className="grid grid-cols-[1fr_auto] items-start gap-2 sm:grid-cols-[1fr_6.5rem_8rem_auto]"
              >
                <FormField
                  control={form.control}
                  name={`lines.${index}.sku`}
                  className="col-span-2 sm:col-span-1"
                  render={({ field, invalid }) => (
                    <Combobox
                      options={options}
                      value={field.value || null}
                      onChange={(sku) => {
                        field.onChange(sku ?? '');
                        const item = catalog.find((i) => i.sku === sku);
                        if (item) form.setValue(`lines.${index}.unitCost`, item.unitCost);
                      }}
                      placeholder={t('item')}
                      searchPlaceholder={t('search')}
                      disabled={!supplier}
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
                <FormField
                  control={form.control}
                  name={`lines.${index}.unitCost`}
                  render={({ field, invalid }) => (
                    <NumberInput
                      aria-label={t('unitCost')}
                      value={field.value}
                      onChange={(v) => field.onChange(v ?? 0)}
                      min={0}
                      precision={2}
                      format="currency"
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
          <p className="flex justify-end gap-2 pt-1 text-sm">
            <span className="text-muted-foreground">{t('total')}</span>
            <span className="font-semibold tabular-nums">{usdCents(total)}</span>
          </p>
        </fieldset>
      </form>
      <DialogFooter>
        <Button variant="ghost" onClick={onDone}>
          {t('cancel')}
        </Button>
        <Button variant="outline" disabled={create.isPending} onClick={submit('draft')}>
          {t('draft')}
        </Button>
        <Button type="submit" form="create-po" disabled={create.isPending}>
          {t('submit')}
        </Button>
      </DialogFooter>
    </>
  );
}

/** New PO for one supplier with any number of lines; saved as a draft or sent right away. */
export function CreatePurchaseOrderDialog({
  open,
  onOpenChange,
  supplierId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId?: string;
}) {
  const { t } = useTranslation('inventory', { keyPrefix: 'purchaseOrders.create' });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <PurchaseOrderForm supplierId={supplierId} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
