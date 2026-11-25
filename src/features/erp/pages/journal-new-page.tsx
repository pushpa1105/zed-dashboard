import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheck, CircleDashed, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import type { PageModule } from '@/core/feature/define-feature';
import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useNavigate } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { Combobox } from '@/shared/components/forms/combobox';
import { DatePicker } from '@/shared/components/forms/date-picker';
import { NumberInput } from '@/shared/components/forms/number-input';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

import { accountOptionsQuery, useAccountOptions, useCreateJournalEntry } from '../api/erp-api';
import { money } from '../lib/money';
import { erpRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(accountOptionsQuery());
    return null;
  };

const cents = (n: number) => Math.round(n * 100);

const lineSchema = z
  .object({
    account: z.string().min(1, 'validation.required'),
    debit: z.number().min(0),
    credit: z.number().min(0),
  })
  .refine((l) => l.debit > 0 !== l.credit > 0, {
    message: 'erp:journal.form.errors.oneSide',
    path: ['debit'],
  });

const entrySchema = z
  .object({
    date: z.date({ message: 'validation.required' }),
    reference: z.string().trim().min(1, 'validation.required').max(24, 'validation.tooLong'),
    memo: z.string().trim().min(1, 'validation.required').max(200, 'validation.tooLong'),
    lines: z.array(lineSchema).min(2, 'erp:journal.form.errors.twoLines'),
  })
  .refine(
    (v) =>
      cents(v.lines.reduce((s, l) => s + l.debit, 0)) ===
      cents(v.lines.reduce((s, l) => s + l.credit, 0)),
    { message: 'erp:journal.form.errors.balance', path: ['lines'] },
  );

type EntryForm = z.infer<typeof entrySchema>;

const emptyLine = { account: '', debit: 0, credit: 0 };

/**
 * New journal entry: a dynamic list of debit/credit lines with live totals.
 * The entry can only be posted when debits equal credits.
 */
export default function JournalNewPage() {
  const { t } = useTranslation('erp', { keyPrefix: 'journal.form' });
  const navigate = useNavigate();
  const options = useAccountOptions();
  const create = useCreateJournalEntry();

  const form = useForm<EntryForm>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      date: new Date(),
      reference: '',
      memo: '',
      lines: [
        { account: '6300', debit: 0, credit: 0 },
        { account: '2140', debit: 0, credit: 0 },
      ],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lines' });
  const lines = useWatch({ control: form.control, name: 'lines' }) ?? [];
  const debit = lines.reduce((s, l) => s + (l?.debit || 0), 0);
  const credit = lines.reduce((s, l) => s + (l?.credit || 0), 0);
  const difference = debit - credit;
  const balanced = cents(difference) === 0 && debit > 0;
  const accountOptions = (options.data ?? []).map((a) => ({
    value: a.code,
    label: `${a.code} · ${a.name}`,
  }));

  const submit = (post: boolean) =>
    form.handleSubmit((values) =>
      create.mutate(
        {
          date: values.date.toISOString().slice(0, 10),
          reference: values.reference,
          memo: values.memo,
          post,
          lines: values.lines,
        },
        { onSuccess: () => void navigate(erpRoutes.journal.href()) },
      ),
    )();

  const linesError =
    form.formState.errors.lines?.root?.message ?? form.formState.errors.lines?.message;
  const checks = [
    { key: 'twoLines', ok: lines.filter((l) => l?.account && (l.debit || l.credit)).length >= 2 },
    { key: 'oneSide', ok: lines.every((l) => !(l?.debit && l?.credit)) },
    { key: 'balance', ok: balanced },
  ] as const;

  return (
    <Page title={t('title')} description={t('description')} width="full">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void submit(true);
        }}
        className="grid items-start gap-6 xl:grid-cols-[1fr_20rem]"
      >
        <div className="min-w-0 space-y-6">
          <SectionCard title={t('details')}>
            <div className="grid gap-4 md:grid-cols-[12rem_10rem_1fr]">
              <FormField
                control={form.control}
                name="date"
                label={t('date')}
                required
                render={({ field, id, invalid }) => (
                  <DatePicker
                    id={id}
                    value={field.value}
                    onChange={(value) => field.onChange(value ?? undefined)}
                    invalid={invalid}
                  />
                )}
              />
              <FormField
                control={form.control}
                name="reference"
                label={t('reference')}
                required
                render={({ field, id, invalid }) => (
                  <Input id={id} {...field} aria-invalid={invalid} placeholder="AWS-1125" />
                )}
              />
              <FormField
                control={form.control}
                name="memo"
                label={t('memo')}
                required
                className="md:col-span-1"
                render={({ field, id, invalid }) => (
                  <Textarea
                    id={id}
                    {...field}
                    aria-invalid={invalid}
                    rows={1}
                    className="min-h-9"
                    placeholder={t('memoPlaceholder')}
                  />
                )}
              />
            </div>
          </SectionCard>

          <SectionCard
            flush
            title={t('lines')}
            description={t('linesDescription')}
            action={
              <Button type="button" variant="outline" size="sm" onClick={() => append(emptyLine)}>
                <Plus /> {t('addLine')}
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-y bg-muted/30 text-xs text-muted-foreground">
                    <th className="h-11 w-10 pl-6 text-left font-medium">#</th>
                    <th className="px-3 text-left font-medium">{t('account')}</th>
                    <th className="w-44 px-3 text-right font-medium">{t('debit')}</th>
                    <th className="w-44 px-3 text-right font-medium">{t('credit')}</th>
                    <th className="w-14 pr-6" />
                  </tr>
                </thead>
                <tbody>
                  {fields.map((row, index) => {
                    const lineError = form.formState.errors.lines?.[index];
                    return (
                      <tr key={row.id} className="border-b align-top">
                        <td className="py-3 pl-6 text-xs text-muted-foreground tabular-nums">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2">
                          <FormField
                            control={form.control}
                            name={`lines.${index}.account`}
                            render={({ field, invalid }) => (
                              <Combobox
                                options={accountOptions}
                                value={field.value || null}
                                onChange={(value) => field.onChange(value ?? '')}
                                placeholder={t('accountPlaceholder')}
                                searchPlaceholder={t('accountSearch')}
                                invalid={invalid}
                                className="w-full"
                              />
                            )}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <FormField
                            control={form.control}
                            name={`lines.${index}.debit`}
                            render={({ field }) => (
                              <NumberInput
                                aria-label={t('debit')}
                                value={field.value || null}
                                onChange={(value) => field.onChange(value ?? 0)}
                                min={0}
                                precision={2}
                                format="currency"
                                invalid={!!lineError?.debit}
                                className="text-right"
                              />
                            )}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <FormField
                            control={form.control}
                            name={`lines.${index}.credit`}
                            render={({ field }) => (
                              <NumberInput
                                aria-label={t('credit')}
                                value={field.value || null}
                                onChange={(value) => field.onChange(value ?? 0)}
                                min={0}
                                precision={2}
                                format="currency"
                                className="text-right"
                              />
                            )}
                          />
                        </td>
                        <td className="py-2 pr-6">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={t('removeLine')}
                            disabled={fields.length <= 2}
                            onClick={() => remove(index)}
                          >
                            <Trash2 />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30 font-semibold">
                    <td className="py-3 pl-6" colSpan={2}>
                      {t('totals')}
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums">{money(debit)}</td>
                    <td className="px-6 py-3 text-right tabular-nums">{money(credit)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            {linesError && (
              <p className="px-6 py-3 text-sm text-destructive" role="alert">
                {t(linesError.replace('erp:journal.form.', '') as 'errors.balance', {
                  defaultValue: linesError,
                })}
              </p>
            )}
          </SectionCard>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <SectionCard title={t('summary')}>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('debit')}</dt>
                <dd className="font-medium tabular-nums">{money(debit)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('credit')}</dt>
                <dd className="font-medium tabular-nums">{money(credit)}</dd>
              </div>
              <div
                className={cn(
                  'flex justify-between rounded-lg px-3 py-2',
                  balanced ? 'bg-success/10 text-success' : 'bg-muted',
                )}
              >
                <dt>{t('difference')}</dt>
                <dd className="font-semibold tabular-nums">{money(difference)}</dd>
              </div>
            </dl>
            <ul className="mt-5 space-y-2 border-t pt-4 text-sm">
              {checks.map((check) => (
                <li key={check.key} className="flex items-center gap-2">
                  {check.ok ? (
                    <CircleCheck className="size-4 text-success" />
                  ) : (
                    <CircleDashed className="size-4 text-muted-foreground" />
                  )}
                  <span className={cn(!check.ok && 'text-muted-foreground')}>
                    {t(`checks.${check.key}`)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 grid gap-2">
              <Button type="submit" disabled={create.isPending || !balanced}>
                {t('post')}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={create.isPending}
                onClick={() => void submit(false)}
              >
                {t('saveDraft')}
              </Button>
            </div>
          </SectionCard>
        </aside>
      </form>
    </Page>
  );
}
