import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { useRefundOrder } from '../api/store-api';
import { formatMoney } from '../lib/money';
import { RETURN_REASONS } from '../model/finance';

/** Partial or full refund. The amount is capped at what is left to refund. */
export function RefundDialog({
  open,
  onOpenChange,
  orderId,
  max,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  max: number;
}) {
  const { t, i18n } = useTranslation('ecommerce');
  const refund = useRefundOrder();
  const schema = z.object({
    amount: z.number().positive().max(max),
    reason: z.enum(RETURN_REASONS),
    restock: z.boolean(),
  });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { amount: max, reason: 'damaged', restock: true },
  });

  useEffect(() => {
    if (open) form.reset({ amount: Math.round(max * 100) / 100, reason: 'damaged', restock: true });
  }, [open, max, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('refund.title')}</DialogTitle>
          <DialogDescription>
            {t('refund.description', { amount: formatMoney(max, i18n.language) })}
          </DialogDescription>
        </DialogHeader>
        <form
          id="refund-form"
          onSubmit={form.handleSubmit((values) =>
            refund.mutate(
              {
                id: orderId,
                amount: values.amount,
                reason: t(`refund.reasons.${values.reason}`),
                restock: values.restock,
              },
              { onSuccess: () => onOpenChange(false) },
            ),
          )}
        >
          <FieldGroup>
            <FormField
              control={form.control}
              name="amount"
              label={t('refund.amount')}
              required
              render={({ field, id, invalid }) => (
                <CurrencyInput
                  id={id}
                  value={field.value}
                  onChange={(v) => field.onChange(v ?? 0)}
                  max={max}
                  invalid={invalid}
                />
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              label={t('refund.reason')}
              render={({ field, id }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id={id} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RETURN_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {t(`refund.reasons.${reason}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FormField
              control={form.control}
              name="restock"
              render={({ field }) => (
                <SwitchRow
                  bordered
                  label={t('refund.restock')}
                  description={t('refund.restockHint')}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="refund-form" disabled={refund.isPending}>
            {t('refund.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
