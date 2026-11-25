import { zodResolver } from '@hookform/resolvers/zod';
import { GripVertical, Plus, Send, Trash2 } from 'lucide-react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';

import { getErrorMessage } from '@/core/api/errors';
import { FormField } from '@/core/forms/form-field';
import { FormFieldError } from '@/core/forms/form-field-error';
import { useTranslation } from '@/core/i18n/use-translation';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { Combobox } from '@/shared/components/forms/combobox';
import { DatePicker } from '@/shared/components/forms/date-picker';
import { NumberInput } from '@/shared/components/forms/number-input';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Separator } from '@/shared/ui/separator';
import { Spinner } from '@/shared/ui/spinner';
import { Textarea } from '@/shared/ui/textarea';

import type { InvoicePayload } from '../api/invoices-api';
import {
  computeTotals,
  invoiceFormSchema,
  money,
  type Customer,
  type InvoiceForm,
} from '../model/invoice';

const DAY = 86_400_000;
const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

type EditorProps = {
  customers: Customer[];
  number?: string;
  pending: 'draft' | 'send' | null;
  error: unknown;
  onSubmit: (payload: InvoicePayload) => void;
  onCancel: () => void;
};

/** Invoice form: customer, dates, line items, discount, tax and live totals. */
export function InvoiceEditor({
  customers,
  number,
  pending,
  error,
  onSubmit,
  onCancel,
}: EditorProps) {
  const { t } = useTranslation('app-invoices');
  const form = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      customerId: '',
      issueDate: today(),
      dueDate: new Date(today().getTime() + 30 * DAY),
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
      taxRate: 20,
      discount: 0,
      notes: t('editor.defaultNotes'),
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });
  const [items, taxRate, discount, customerId, issueDate] = useWatch({
    control: form.control,
    name: ['items', 'taxRate', 'discount', 'customerId', 'issueDate'],
  });
  const totals = computeTotals(items ?? [], taxRate, discount);
  const customer = customers.find((c) => c.id === customerId);

  const submit = (send: boolean) =>
    form.handleSubmit((values) =>
      onSubmit({
        ...values,
        issueDate: values.issueDate.getTime(),
        dueDate: values.dueDate.getTime(),
        send,
      }),
    );

  return (
    <form
      onSubmit={(e) => void submit(true)(e)}
      noValidate
      className="grid items-start gap-6 xl:grid-cols-[1fr_22rem]"
    >
      <div className="space-y-6">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{getErrorMessage(error)}</AlertDescription>
          </Alert>
        ) : null}

        <SectionCard title={t('editor.billTo')} description={t('editor.billToHint')}>
          <div className="grid gap-5 md:grid-cols-3">
            <FormField
              control={form.control}
              name="customerId"
              label={t('editor.customer')}
              required
              className="md:col-span-3"
              render={({ field, id, invalid }) => (
                <Combobox
                  id={id}
                  value={field.value || null}
                  onChange={(v) => field.onChange(v ?? '')}
                  invalid={invalid}
                  placeholder={t('editor.customerPlaceholder')}
                  options={customers.map((c) => ({
                    value: c.id,
                    label: c.name,
                    description: c.email,
                    icon: <InitialsAvatar name={c.name} size="xs" shape="square" />,
                  }))}
                />
              )}
            />
            <FormField
              control={form.control}
              name="issueDate"
              label={t('editor.issueDate')}
              render={({ field, id }) => (
                <DatePicker id={id} value={field.value} onChange={(d) => d && field.onChange(d)} />
              )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              label={t('editor.dueDate')}
              render={({ field, id, invalid }) => (
                <DatePicker
                  id={id}
                  value={field.value}
                  onChange={(d) => d && field.onChange(d)}
                  invalid={invalid}
                />
              )}
            />
            <div className="grid gap-2">
              <span className="text-sm font-medium">{t('editor.terms')}</span>
              <div className="flex gap-1.5">
                {[15, 30, 45].map((days) => (
                  <Button
                    key={days}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      form.setValue(
                        'dueDate',
                        new Date((issueDate ?? today()).getTime() + days * DAY),
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                        },
                      )
                    }
                  >
                    {t('editor.net', { days })}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t('editor.items')} description={t('editor.itemsHint')} flush>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="border-y bg-muted/40 text-xs text-muted-foreground">
                  <th className="w-8" />
                  <th className="px-3 py-2.5 text-left font-medium">{t('editor.description')}</th>
                  <th className="w-36 px-3 py-2.5 text-left font-medium">{t('editor.quantity')}</th>
                  <th className="w-40 px-3 py-2.5 text-left font-medium">
                    {t('editor.unitPrice')}
                  </th>
                  <th className="w-32 px-3 py-2.5 text-right font-medium">
                    {t('editor.lineTotal')}
                  </th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {fields.map((row, index) => {
                  const line = items?.[index];
                  const rowError = form.formState.errors.items?.[index]?.description;
                  return (
                    <tr key={row.id} className="border-b align-top last:border-b-0">
                      <td className="pt-4 pl-3 text-muted-foreground/50">
                        <GripVertical className="size-4" aria-hidden />
                      </td>
                      <td className="px-3 py-2.5">
                        <Input
                          {...form.register(`items.${index}.description`)}
                          placeholder={t('editor.descriptionPlaceholder')}
                          aria-label={t('editor.description')}
                          aria-invalid={!!rowError || undefined}
                        />
                        <FormFieldError error={rowError} />
                      </td>
                      <td className="px-3 py-2.5">
                        <NumberInput
                          value={line?.quantity ?? 1}
                          onChange={(v) =>
                            form.setValue(`items.${index}.quantity`, v ?? 1, { shouldDirty: true })
                          }
                          min={1}
                          aria-label={t('editor.quantity')}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <NumberInput
                          value={line?.unitPrice ?? 0}
                          onChange={(v) =>
                            form.setValue(`items.${index}.unitPrice`, v ?? 0, { shouldDirty: true })
                          }
                          min={0}
                          step={10}
                          precision={2}
                          format="currency"
                          steppers={false}
                          aria-label={t('editor.unitPrice')}
                        />
                      </td>
                      <td className="px-3 py-2.5 pt-4 text-right font-medium tabular-nums">
                        {money((line?.quantity ?? 0) * (line?.unitPrice ?? 0))}
                      </td>
                      <td className="py-2.5 pr-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={fields.length === 1}
                          onClick={() => remove(index)}
                          aria-label={t('editor.removeLine', { index: index + 1 })}
                        >
                          <Trash2 />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t p-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
            >
              <Plus /> {t('editor.addLine')}
            </Button>
          </div>
        </SectionCard>

        <SectionCard title={t('editor.notes')}>
          <Textarea {...form.register('notes')} rows={3} aria-label={t('editor.notes')} />
          <FormFieldError error={form.formState.errors.notes} />
        </SectionCard>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-20">
        <SectionCard
          title={t('editor.summary')}
          description={number ? t('editor.number', { number }) : undefined}
        >
          {customer ? (
            <div className="mb-5 flex items-start gap-3 rounded-lg bg-muted/50 p-3">
              <InitialsAvatar name={customer.name} shape="square" />
              <div className="min-w-0 text-sm">
                <p className="font-medium">{customer.name}</p>
                <p className="text-xs text-muted-foreground">{customer.address}</p>
              </div>
            </div>
          ) : (
            <p className="mb-5 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              {t('editor.noCustomer')}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="discount"
              label={t('editor.discount')}
              render={({ field, id }) => (
                <NumberInput
                  id={id}
                  value={field.value}
                  onChange={(v) => field.onChange(v ?? 0)}
                  min={0}
                  format="currency"
                  steppers={false}
                />
              )}
            />
            <FormField
              control={form.control}
              name="taxRate"
              label={t('editor.taxRate')}
              render={({ field, id }) => (
                <NumberInput
                  id={id}
                  value={field.value}
                  onChange={(v) => field.onChange(v ?? 0)}
                  min={0}
                  max={100}
                  suffix="%"
                />
              )}
            />
          </div>
          <dl className="mt-5 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('totals.subtotal')}</dt>
              <dd className="tabular-nums">{money(totals.subtotal)}</dd>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('totals.discount')}</dt>
                <dd className="tabular-nums">−{money(totals.discountAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('totals.tax', { rate: taxRate || 0 })}</dt>
              <dd className="tabular-nums">{money(totals.tax)}</dd>
            </div>
            <Separator />
            <div className="flex items-baseline justify-between">
              <dt className="font-medium">{t('totals.total')}</dt>
              <dd className="text-2xl font-semibold tracking-tight tabular-nums">
                {money(totals.total)}
              </dd>
            </div>
          </dl>
        </SectionCard>
        <div className="grid gap-2">
          <Button type="submit" size="lg" disabled={!!pending}>
            {pending === 'send' ? <Spinner /> : <Send />} {t('editor.saveAndSend')}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!!pending}
              onClick={(e) => void submit(false)(e)}
            >
              {pending === 'draft' && <Spinner />} {t('editor.saveDraft')}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              {t('editor.cancel')}
            </Button>
          </div>
        </div>
      </aside>
    </form>
  );
}
