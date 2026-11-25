import { Trash2 } from 'lucide-react';
import { Controller, useFieldArray, useWatch, type Control } from 'react-hook-form';

import { useTranslation } from '@/core/i18n/use-translation';
import { Combobox } from '@/shared/components/forms/combobox';
import { CurrencyInput } from '@/shared/components/forms/currency-input';
import { NumberInput } from '@/shared/components/forms/number-input';
import { Button } from '@/shared/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { useProducts } from '../api/quotes-api';
import { money } from '../lib/format';
import type { QuoteDraft } from '../model/quotes';

/** Editable line items of a quote draft; read-only once `disabled`. */
export function QuoteLines({
  control,
  disabled,
}: {
  control: Control<QuoteDraft>;
  disabled: boolean;
}) {
  const { t } = useTranslation('crm');
  const products = useProducts();
  const lines = useFieldArray({ control, name: 'lines' });
  const values = useWatch({ control, name: 'lines' });
  const used = new Set(values.map((l) => l.productId));
  const skuOf = (id: string) => products.data?.find((p) => p.id === id)?.sku;
  const addable = (products.data ?? []).filter((p) => p.active && !used.has(p.id));

  const add = (productId: string | null) => {
    const product = addable.find((p) => p.id === productId);
    if (product)
      lines.append({
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.listPrice,
      });
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table className="min-w-[36rem]">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">{t('quote.lines.product')}</TableHead>
              <TableHead className="w-28">{t('quote.lines.quantity')}</TableHead>
              <TableHead className="w-36">{t('quote.lines.unitPrice')}</TableHead>
              <TableHead className="w-32 text-right">{t('quote.lines.amount')}</TableHead>
              <TableHead className="w-14 pr-6" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.fields.map((line, index) => {
              const value = values[index] ?? line;
              return (
                <TableRow key={line.id}>
                  <TableCell className="pl-6">
                    <p className="font-medium">{line.name}</p>
                    <p className="text-xs text-muted-foreground">{skuOf(line.productId)}</p>
                  </TableCell>
                  <TableCell>
                    <Controller
                      control={control}
                      name={`lines.${index}.quantity`}
                      render={({ field }) => (
                        <NumberInput
                          value={field.value}
                          onChange={(v) => field.onChange(v ?? 1)}
                          min={1}
                          max={999}
                          disabled={disabled}
                          aria-label={t('quote.lines.quantityOf', { name: line.name })}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      control={control}
                      name={`lines.${index}.unitPrice`}
                      render={({ field }) => (
                        <CurrencyInput
                          value={field.value}
                          onChange={(v) => field.onChange(v ?? 0)}
                          disabled={disabled}
                          aria-label={t('quote.lines.unitPriceOf', { name: line.name })}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {money(value.quantity * value.unitPrice)}
                  </TableCell>
                  <TableCell className="pr-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={disabled || lines.fields.length === 1}
                      onClick={() => lines.remove(index)}
                      aria-label={t('quote.lines.remove', { name: line.name })}
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {!disabled && (
        <div className="px-6 pb-6">
          <Combobox
            className="sm:w-80"
            value={null}
            onChange={add}
            placeholder={t('quote.lines.add')}
            options={addable.map((p) => ({
              value: p.id,
              label: p.name,
              description: `${p.sku} · ${money(p.listPrice)}`,
            }))}
          />
        </div>
      )}
    </div>
  );
}
