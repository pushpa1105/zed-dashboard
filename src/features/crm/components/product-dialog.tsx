import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { CurrencyInput } from '@/shared/components/forms/currency-input';
import { SwitchRow } from '@/shared/components/forms/switch-row';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { FieldGroup } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { useSaveProduct } from '../api/quotes-api';
import {
  marginOf,
  PRODUCT_CATEGORIES,
  productInputSchema,
  type Product,
  type ProductInput,
} from '../model/quotes';

const BLANK: ProductInput = {
  name: '',
  sku: '',
  category: 'addon',
  listPrice: 0,
  cost: 0,
  active: true,
};

/** Create (`product` undefined) or edit a price-book entry. */
export function ProductDialog({
  open,
  product,
  onOpenChange,
}: {
  open: boolean;
  product?: Product;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation('crm');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? t('products.edit') : t('products.new')}</DialogTitle>
          <DialogDescription>{t('products.form.description')}</DialogDescription>
        </DialogHeader>
        <ProductForm product={product} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ProductForm({ product, onDone }: { product?: Product; onDone: () => void }) {
  const { t } = useTranslation('crm');
  const save = useSaveProduct();
  const form = useForm<ProductInput>({
    resolver: zodResolver(productInputSchema),
    defaultValues: product ?? BLANK,
  });
  const [listPrice, cost] = useWatch({ control: form.control, name: ['listPrice', 'cost'] });

  const submit = form.handleSubmit((values) =>
    save.mutate({ ...values, id: product?.id }, { onSuccess: onDone }),
  );

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
          <FormField
            control={form.control}
            name="name"
            label={t('products.form.name')}
            required
            render={({ field, id, invalid }) => <Input {...field} id={id} aria-invalid={invalid} />}
          />
          <FormField
            control={form.control}
            name="sku"
            label={t('products.columns.sku')}
            required
            render={({ field, id, invalid }) => <Input {...field} id={id} aria-invalid={invalid} />}
          />
        </div>
        <FormField
          control={form.control}
          name="category"
          label={t('products.columns.category')}
          render={({ field, id }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={id} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`products.category.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {(['listPrice', 'cost'] as const).map((name) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              label={t(`products.columns.${name}`)}
              required
              render={({ field, id, invalid }) => (
                <CurrencyInput
                  id={id}
                  invalid={invalid}
                  value={field.value}
                  onChange={(v) => field.onChange(v ?? 0)}
                />
              )}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {t('products.form.margin', { pct: Math.round(marginOf({ listPrice, cost })) })}
        </p>
        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <SwitchRow
              bordered
              label={t('products.form.active')}
              description={t('products.form.activeHint')}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </FieldGroup>
      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={onDone}>
          {t('quickAdd.cancel')}
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {t('products.form.save')}
        </Button>
      </DialogFooter>
    </form>
  );
}
