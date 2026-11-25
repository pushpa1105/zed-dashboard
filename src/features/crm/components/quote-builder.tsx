import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheck, CircleX, Save, Send, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Controller, useForm, useWatch, type Control } from 'react-hook-form';

import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { DescriptionList } from '@/shared/components/display/description-list';
import { NumberInput } from '@/shared/components/forms/number-input';
import { Button } from '@/shared/ui/button';

import { useSaveQuote, useSetQuoteStatus } from '../api/quotes-api';
import { money, relativeDays, shortDate } from '../lib/format';
import {
  NEXT_QUOTE_STATUS,
  quoteDraftSchema,
  quoteTotals,
  type Quote,
  type QuoteDraft,
  type QuoteStatus,
} from '../model/quotes';
import { crmRoutes } from '../routes';

import { QuoteStatusBadge } from './crm-parts';
import { QuoteLines } from './quote-lines';

const ACTION_ICON: Record<Exclude<QuoteStatus, 'draft'>, LucideIcon> = {
  sent: Send,
  accepted: CircleCheck,
  declined: CircleX,
};

function TotalRow({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        {label}
        {children}
      </span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function RateInput({
  control,
  name,
  max,
  disabled,
  label,
}: {
  control: Control<QuoteDraft>;
  name: 'discountPct' | 'taxRate';
  max: number;
  disabled: boolean;
  label: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <NumberInput
          className="w-24"
          value={field.value}
          onChange={(v) => field.onChange(v ?? 0)}
          min={0}
          max={max}
          step={0.5}
          precision={1}
          suffix="%"
          steppers={false}
          disabled={disabled}
          aria-label={label}
        />
      )}
    />
  );
}

/** Line items, discount and tax of one quote, with live totals and status actions. */
export function QuoteBuilder({ quote }: { quote: Quote }) {
  const { t, i18n } = useTranslation('crm');
  const save = useSaveQuote();
  const setStatus = useSetQuoteStatus();
  const { lines, discountPct, taxRate } = quote;
  const form = useForm<QuoteDraft>({
    resolver: zodResolver(quoteDraftSchema),
    defaultValues: { lines, discountPct, taxRate },
  });
  const [watchedLines, watchedDiscount, watchedTax] = useWatch({
    control: form.control,
    name: ['lines', 'discountPct', 'taxRate'],
  });
  const totals = quoteTotals({
    lines: watchedLines,
    discountPct: watchedDiscount,
    taxRate: watchedTax,
  });
  const editable = quote.status === 'draft';
  const dirty = form.formState.isDirty;

  const submit = form.handleSubmit((draft) =>
    save.mutate({ ...draft, id: quote.id }, { onSuccess: () => form.reset(draft) }),
  );

  return (
    <form onSubmit={submit} noValidate className="grid items-start gap-4 md:gap-6 lg:grid-cols-12">
      <SectionCard
        title={t('quote.lines.title')}
        description={editable ? t('quote.lines.hint') : t('quote.lines.locked')}
        className="lg:col-span-8"
        flush
      >
        <QuoteLines control={form.control} disabled={!editable} />
      </SectionCard>

      <div className="space-y-4 md:space-y-6 lg:col-span-4">
        <SectionCard title={t('quote.summary')}>
          <div className="divide-y">
            <TotalRow label={t('quote.subtotal')} value={money(totals.subtotal)} />
            <TotalRow label={t('quote.discount')} value={`−${money(totals.discount)}`}>
              <RateInput
                control={form.control}
                name="discountPct"
                max={50}
                disabled={!editable}
                label={t('quote.discount')}
              />
            </TotalRow>
            <TotalRow label={t('quote.tax')} value={money(totals.tax)}>
              <RateInput
                control={form.control}
                name="taxRate"
                max={30}
                disabled={!editable}
                label={t('quote.tax')}
              />
            </TotalRow>
            <div className="flex items-baseline justify-between pt-4">
              <span className="font-medium">{t('quote.total')}</span>
              <span className="text-2xl font-semibold tracking-tight tabular-nums">
                {money(totals.total)}
              </span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            {editable && (
              <Button type="submit" variant="outline" disabled={!dirty || save.isPending}>
                <Save /> {t('quote.save')}
              </Button>
            )}
            {NEXT_QUOTE_STATUS[quote.status].map((next) => {
              const Icon = ACTION_ICON[next];
              return (
                <Button
                  key={next}
                  type="button"
                  variant={next === 'declined' ? 'outline' : 'default'}
                  disabled={dirty || setStatus.isPending}
                  onClick={() => setStatus.mutate({ id: quote.id, status: next })}
                >
                  <Icon /> {t(`quote.actions.${next}`)}
                </Button>
              );
            })}
          </div>
          {dirty && (
            <p className="mt-3 text-right text-xs text-muted-foreground">{t('quote.saveFirst')}</p>
          )}
        </SectionCard>

        <SectionCard title={t('quote.details')}>
          <DescriptionList
            items={[
              {
                key: 'status',
                term: t('quotes.columns.status'),
                detail: <QuoteStatusBadge status={quote.status} />,
              },
              {
                key: 'deal',
                term: t('quote.deal'),
                detail: (
                  <Link
                    to={crmRoutes.deal.href({ dealId: quote.dealId })}
                    className="font-medium hover:underline"
                  >
                    {quote.title}
                  </Link>
                ),
              },
              { key: 'contact', term: t('quote.contact'), detail: quote.contact },
              { key: 'owner', term: t('common.owner'), detail: quote.owner },
              {
                key: 'created',
                term: t('quotes.columns.createdAt'),
                detail: shortDate(quote.createdAt),
              },
              {
                key: 'valid',
                term: t('quotes.columns.validUntil'),
                detail: `${shortDate(quote.validUntil)} · ${relativeDays(quote.validUntil, i18n.language)}`,
              },
            ]}
          />
        </SectionCard>
      </div>
    </form>
  );
}
