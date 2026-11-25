import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarClock, Percent, Plus, Shuffle, Tag as TagIcon, Truck } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type { PageModule } from '@/core/feature/define-feature';
import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { CopyButton } from '@/shared/components/display/copy-button';
import { ErrorState } from '@/shared/components/display/error-state';
import { Tag } from '@/shared/components/display/tag';
import { CurrencyInput } from '@/shared/components/forms/currency-input';
import { NumberInput } from '@/shared/components/forms/number-input';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { cn } from '@/shared/lib/cn';
import { formatDate } from '@/shared/lib/format';
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
import { Skeleton } from '@/shared/ui/skeleton';

import {
  discountsQuery,
  useCreateDiscount,
  useDiscounts,
  useSetDiscountStatus,
} from '../api/store-api';
import { formatMoney } from '../lib/money';
import {
  DISCOUNT_TYPES,
  discountFormSchema,
  type Discount,
  type DiscountForm,
} from '../model/store';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(discountsQuery());
    return null;
  };

const TYPE_ICON = { percentage: Percent, fixed: TagIcon, free_shipping: Truck } as const;
const randomCode = () =>
  Array.from(
    { length: 8 },
    () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)],
  ).join('');

function CreateDiscountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation('ecommerce');
  const create = useCreateDiscount();
  const [now] = useState(Date.now);
  const form = useForm<DiscountForm>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      code: '',
      type: 'percentage',
      value: 15,
      minSpend: 0,
      limit: null,
      appliesTo: '',
      startsAt: now,
      endsAt: null,
    },
  });
  const type = useWatch({ control: form.control, name: 'type' });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) form.reset();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('discounts.create.title')}</DialogTitle>
          <DialogDescription>{t('discounts.create.description')}</DialogDescription>
        </DialogHeader>
        <form
          id="discount-form"
          noValidate
          onSubmit={form.handleSubmit((values) =>
            create.mutate(values, { onSuccess: () => (onOpenChange(false), form.reset()) }),
          )}
        >
          <FieldGroup>
            <FormField
              control={form.control}
              name="code"
              label={t('discounts.create.code')}
              required
              render={({ field, id, invalid }) => (
                <div className="flex gap-2">
                  <Input
                    id={id}
                    aria-invalid={invalid}
                    className="font-mono uppercase"
                    placeholder="SPRING15"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.setValue('code', randomCode(), { shouldValidate: true })}
                  >
                    <Shuffle /> {t('discounts.create.generate')}
                  </Button>
                </div>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              label={t('discounts.create.type')}
              render={({ field }) => (
                <SegmentedControl
                  value={field.value}
                  onChange={field.onChange}
                  options={DISCOUNT_TYPES.map((value) => ({
                    value,
                    label: t(`discounts.type.${value}`),
                  }))}
                  className="w-full"
                />
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {type !== 'free_shipping' && (
                <FormField
                  control={form.control}
                  name="value"
                  label={
                    type === 'percentage'
                      ? t('discounts.create.percent')
                      : t('discounts.create.amount')
                  }
                  render={({ field, id }) =>
                    type === 'percentage' ? (
                      <NumberInput
                        id={id}
                        value={field.value}
                        onChange={(v) => field.onChange(v ?? 0)}
                        min={1}
                        max={90}
                        suffix="%"
                      />
                    ) : (
                      <CurrencyInput
                        id={id}
                        value={field.value}
                        onChange={(v) => field.onChange(v ?? 0)}
                      />
                    )
                  }
                />
              )}
              <FormField
                control={form.control}
                name="minSpend"
                label={t('discounts.create.minSpend')}
                render={({ field, id }) => (
                  <CurrencyInput
                    id={id}
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? 0)}
                  />
                )}
              />
              <FormField
                control={form.control}
                name="limit"
                label={t('discounts.create.limit')}
                description={t('discounts.create.limitHint')}
                render={({ field, id }) => (
                  <NumberInput
                    id={id}
                    value={field.value}
                    onChange={field.onChange}
                    min={1}
                    placeholder="∞"
                  />
                )}
              />
              <FormField
                control={form.control}
                name="appliesTo"
                label={t('discounts.create.appliesTo')}
                required
                render={({ field, id, invalid }) => (
                  <Input
                    id={id}
                    aria-invalid={invalid}
                    placeholder={t('discounts.create.appliesToPlaceholder')}
                    {...field}
                  />
                )}
              />
            </div>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="discount-form" disabled={create.isPending}>
            {t('discounts.create.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DiscountCard({ discount }: { discount: Discount }) {
  const { t, i18n } = useTranslation('ecommerce');
  const setStatus = useSetDiscountStatus();
  const Icon = TYPE_ICON[discount.type];
  const value =
    discount.type === 'percentage'
      ? `${discount.value}% ${t('discounts.off')}`
      : discount.type === 'fixed'
        ? `${formatMoney(discount.value, i18n.language, 0)} ${t('discounts.off')}`
        : t('discounts.type.free_shipping');
  const pct = discount.limit ? Math.min(100, (discount.used / discount.limit) * 100) : null;

  return (
    <li
      className={cn(
        'flex flex-col rounded-xl border bg-card shadow-xs',
        discount.status === 'expired' && 'bg-muted/40',
      )}
    >
      <div className="flex items-start gap-3 p-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <code className="truncate font-mono text-base font-semibold tracking-wide">
              {discount.code}
            </code>
            <CopyButton value={discount.code} label={t('discounts.copy')} />
          </div>
          <p className="text-sm text-muted-foreground">{value}</p>
        </div>
        <Tag
          size="sm"
          dot
          tone={
            discount.status === 'active'
              ? 'success'
              : discount.status === 'scheduled'
                ? 'info'
                : 'neutral'
          }
        >
          {t(`discounts.status.${discount.status}`)}
        </Tag>
      </div>
      <div className="space-y-3 border-t border-dashed px-5 py-4 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">{t('discounts.appliesTo')}</span>
          <span className="truncate text-right">{discount.appliesTo}</span>
        </div>
        {discount.minSpend > 0 && (
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">{t('discounts.minSpend')}</span>
            <span className="tabular-nums">{formatMoney(discount.minSpend, i18n.language, 0)}</span>
          </div>
        )}
        <div className="space-y-1.5">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">{t('discounts.used')}</span>
            <span className="tabular-nums">
              {discount.used.toLocaleString()}
              {discount.limit ? ` / ${discount.limit.toLocaleString()}` : ''}
            </span>
          </div>
          {pct !== null && (
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      </div>
      <div className="mt-auto flex items-center gap-2 border-t px-5 py-3 text-xs text-muted-foreground">
        <CalendarClock className="size-3.5" />
        {formatDate(discount.startsAt, 'MMM D')}
        {' – '}
        {discount.endsAt ? formatDate(discount.endsAt, 'MMM D, YYYY') : t('discounts.noEnd')}
        {discount.status !== 'expired' && (
          <Button
            variant="ghost"
            size="xs"
            className="ml-auto"
            disabled={setStatus.isPending}
            onClick={() => setStatus.mutate({ id: discount.id, status: 'expired' })}
          >
            {t('discounts.end')}
          </Button>
        )}
      </div>
    </li>
  );
}

/** Discount codes as cards with usage meters; create new codes in a dialog. */
export default function DiscountsPage() {
  const { t } = useTranslation('ecommerce');
  const discounts = useDiscounts();
  const [creating, setCreating] = useState(false);
  const groups = (['active', 'scheduled', 'expired'] as const).map((status) => ({
    status,
    items: discounts.data?.filter((d) => d.status === status) ?? [],
  }));

  return (
    <Page
      width="full"
      title={t('discounts.title')}
      description={t('discounts.description')}
      actions={
        <Button onClick={() => setCreating(true)}>
          <Plus /> {t('discounts.new')}
        </Button>
      }
    >
      {discounts.isError ? (
        <ErrorState title={t('common.error')} onRetry={() => void discounts.refetch()} />
      ) : !discounts.data ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : (
        groups
          .filter((g) => g.items.length)
          .map((group) => (
            <section key={group.status} className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                {t(`discounts.groups.${group.status}`)} · {group.items.length}
              </h2>
              <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {group.items.map((discount) => (
                  <DiscountCard key={discount.id} discount={discount} />
                ))}
              </ul>
            </section>
          ))
      )}
      <CreateDiscountDialog open={creating} onOpenChange={setCreating} />
    </Page>
  );
}
