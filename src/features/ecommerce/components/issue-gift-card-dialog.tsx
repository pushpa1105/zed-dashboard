import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { CurrencyInput } from '@/shared/components/forms/currency-input';
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
import { FieldGroup } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

import { useIssueGiftCard } from '../api/marketing-api';
import { formatMoney } from '../lib/money';
import {
  GIFT_CARD_EXPIRY,
  GIFT_CARD_VALUES,
  giftCardFormSchema,
  type GiftCardForm,
} from '../model/marketing';

const DEFAULTS: GiftCardForm = {
  recipientName: '',
  recipientEmail: '',
  value: 50,
  expiry: '12',
  note: '',
};

export function IssueGiftCardDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, i18n } = useTranslation('ecommerce');
  const issue = useIssueGiftCard();
  const form = useForm<GiftCardForm>({
    resolver: zodResolver(giftCardFormSchema),
    defaultValues: DEFAULTS,
  });
  const close = () => {
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : close())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('giftCards.issue.title')}</DialogTitle>
          <DialogDescription>{t('giftCards.issue.description')}</DialogDescription>
        </DialogHeader>
        <form
          id="gift-card-form"
          noValidate
          onSubmit={form.handleSubmit((values) => issue.mutate(values, { onSuccess: close }))}
        >
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="recipientName"
                label={t('giftCards.issue.name')}
                required
                render={({ field, id, invalid }) => (
                  <Input id={id} aria-invalid={invalid} autoComplete="off" {...field} />
                )}
              />
              <FormField
                control={form.control}
                name="recipientEmail"
                label={t('giftCards.issue.email')}
                required
                render={({ field, id, invalid }) => (
                  <Input
                    id={id}
                    type="email"
                    aria-invalid={invalid}
                    autoComplete="off"
                    {...field}
                  />
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="value"
              label={t('giftCards.issue.value')}
              render={({ field, id, invalid }) => (
                <div className="space-y-2">
                  <CurrencyInput
                    id={id}
                    aria-invalid={invalid}
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? 0)}
                  />
                  <div className="flex flex-wrap gap-2">
                    {GIFT_CARD_VALUES.map((value) => (
                      <Button
                        key={value}
                        type="button"
                        size="xs"
                        variant={field.value === value ? 'secondary' : 'outline'}
                        onClick={() => field.onChange(value)}
                      >
                        {formatMoney(value, i18n.language, 0)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            />
            <FormField
              control={form.control}
              name="expiry"
              label={t('giftCards.issue.expiry')}
              render={({ field }) => (
                <SegmentedControl
                  value={field.value}
                  onChange={field.onChange}
                  options={GIFT_CARD_EXPIRY.map((value) => ({
                    value,
                    label: t(`giftCards.issue.expiryOptions.${value}`),
                  }))}
                  className="w-full"
                />
              )}
            />
            <FormField
              control={form.control}
              name="note"
              label={t('giftCards.issue.note')}
              description={t('giftCards.issue.noteHint')}
              render={({ field, id, invalid }) => (
                <Textarea id={id} aria-invalid={invalid} rows={2} {...field} />
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="gift-card-form" disabled={issue.isPending}>
            {t('giftCards.issue.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
