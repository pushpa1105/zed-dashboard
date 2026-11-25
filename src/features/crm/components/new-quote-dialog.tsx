import { zodResolver } from '@hookform/resolvers/zod';
import { FilePlus2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { useNavigate } from '@/core/router/router';
import { Combobox } from '@/shared/components/forms/combobox';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { FieldGroup } from '@/shared/ui/field';

import { useDeals } from '../api/crm-api';
import { useCreateQuote } from '../api/quotes-api';
import { money } from '../lib/format';
import { OPEN_STAGES } from '../model/crm';
import { newQuoteSchema, type NewQuoteInput } from '../model/quotes';
import { crmRoutes } from '../routes';

const VALIDITY = ['15', '30', '60'] as const;

/** Starts a draft quote for an open deal and opens it in the builder. */
export function NewQuoteDialog() {
  const { t } = useTranslation('crm');
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const deals = useDeals();
  const create = useCreateQuote();
  const form = useForm<NewQuoteInput>({
    resolver: zodResolver(newQuoteSchema),
    defaultValues: { dealId: '', validDays: 30 },
  });

  const openDeals = (deals.data ?? []).filter((d) =>
    (OPEN_STAGES as readonly string[]).includes(d.stage),
  );
  const submit = form.handleSubmit((values) =>
    create.mutate(values, {
      onSuccess: (quote) => void navigate(crmRoutes.quote.href({ quoteId: quote.id })),
    }),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FilePlus2 /> {t('quotes.new')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('quotes.form.title')}</DialogTitle>
          <DialogDescription>{t('quotes.form.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate>
          <FieldGroup>
            <FormField
              control={form.control}
              name="dealId"
              label={t('quotes.form.deal')}
              required
              render={({ field, id, invalid }) => (
                <Combobox
                  id={id}
                  invalid={invalid}
                  value={field.value || null}
                  onChange={(v) => field.onChange(v ?? '')}
                  placeholder={t('quotes.form.dealPlaceholder')}
                  options={openDeals.map((d) => ({
                    value: d.id,
                    label: d.name,
                    description: `${d.company} · ${money(d.value)}`,
                  }))}
                />
              )}
            />
            <FormField
              control={form.control}
              name="validDays"
              label={t('quotes.form.validity')}
              render={({ field }) => (
                <SegmentedControl
                  value={String(field.value)}
                  onChange={(v) => field.onChange(Number(v))}
                  options={VALIDITY.map((days) => ({
                    value: days,
                    label: t('quotes.form.days', { count: Number(days) }),
                  }))}
                />
              )}
            />
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="submit" disabled={create.isPending}>
              {t('quotes.form.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
