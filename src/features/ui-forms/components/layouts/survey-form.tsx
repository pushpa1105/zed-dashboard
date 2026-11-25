import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { useDemoSubmit } from '@/features/ui-forms/api/ui-forms-api';
import { CheckboxGroup } from '@/shared/components/forms/checkbox-group';
import { Rating } from '@/shared/components/forms/rating';
import { TextareaWithCounter } from '@/shared/components/forms/textarea-with-counter';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Spinner } from '@/shared/ui/spinner';

const MATRIX_ROWS = ['speed', 'reliability', 'docs', 'support'] as const;
const MATRIX_COLS = ['1', '2', '3', '4', '5'] as const;
const FEATURES = ['dashboards', 'alerts', 'exports', 'api', 'sso'] as const;

const schema = z.object({
  nps: z.number({ message: 'validation.required' }).min(0).max(10),
  satisfaction: z.number().min(1, 'validation.required'),
  matrix: z
    .record(z.string(), z.string())
    .refine((m) => MATRIX_ROWS.every((row) => m[row]), 'ui-forms:survey.matrixRequired'),
  features: z.array(z.string()),
  comment: z.string().max(500, 'validation.tooLong'),
});
type Survey = z.infer<typeof schema>;

function NpsScale({
  value,
  onChange,
  invalid,
  lowLabel,
  highLabel,
}: {
  value?: number;
  onChange: (v: number) => void;
  invalid: boolean;
  lowLabel: string;
  highLabel: string;
}) {
  return (
    <div className="space-y-2">
      <div role="radiogroup" className="grid grid-cols-11 gap-1">
        {Array.from({ length: 11 }, (_, n) => {
          const tone = n <= 6 ? 'detractor' : n <= 8 ? 'passive' : 'promoter';
          const checked = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-invalid={invalid || undefined}
              onClick={() => onChange(n)}
              className={cn(
                'h-10 rounded-md border text-sm font-medium tabular-nums transition-colors hover:bg-muted aria-invalid:border-destructive',
                checked &&
                  tone === 'detractor' &&
                  'border-destructive bg-destructive text-destructive-foreground hover:bg-destructive',
                checked &&
                  tone === 'passive' &&
                  'border-warning bg-warning text-foreground hover:bg-warning',
                checked &&
                  tone === 'promoter' &&
                  'border-success bg-success text-success-foreground hover:bg-success',
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

/** Questionnaire: NPS 0–10, star rating, a matrix of radio scales, multi-choice and free text. */
export function SurveyForm() {
  const { t } = useTranslation('ui-forms');
  const form = useForm<Survey>({
    resolver: zodResolver(schema),
    defaultValues: { satisfaction: 0, matrix: {}, features: [], comment: '' },
  });
  const submit = useDemoSubmit({
    onSuccess: () => {
      notify.success(t('survey.thanks'));
      form.reset();
    },
  });

  return (
    <form noValidate onSubmit={form.handleSubmit((v) => submit.mutate(v))} className="space-y-8">
      <FormField
        control={form.control}
        name="nps"
        label={t('survey.nps')}
        required
        render={({ field, invalid }) => (
          <NpsScale
            value={field.value}
            onChange={field.onChange}
            invalid={invalid}
            lowLabel={t('survey.npsLow')}
            highLabel={t('survey.npsHigh')}
          />
        )}
      />

      <FormField
        control={form.control}
        name="satisfaction"
        label={t('survey.satisfaction')}
        required
        render={({ field }) => <Rating value={field.value} onChange={field.onChange} size="lg" />}
      />

      <Controller
        control={form.control}
        name="matrix"
        render={({ field, fieldState }) => (
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">
              {t('survey.matrix')} <span className="text-destructive">*</span>
            </legend>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[32rem] text-sm">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground" />
                    {MATRIX_COLS.map((col) => (
                      <th
                        key={col}
                        className="px-2 py-2.5 text-center text-xs font-medium text-muted-foreground"
                      >
                        {t(`survey.scale.${col}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MATRIX_ROWS.map((row) => (
                    <tr key={row} className="border-t">
                      <th scope="row" className="px-3 py-3 text-left font-normal">
                        {t(`survey.rows.${row}`)}
                      </th>
                      {MATRIX_COLS.map((col) => (
                        <td key={col} className="px-2 py-3 text-center">
                          <input
                            type="radio"
                            name={`matrix-${row}`}
                            aria-label={`${t(`survey.rows.${row}`)}: ${t(`survey.scale.${col}`)}`}
                            checked={field.value[row] === col}
                            onChange={() => field.onChange({ ...field.value, [row]: col })}
                            className="size-4 accent-primary"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {fieldState.error && (
              <p className="text-sm text-destructive">{t('survey.matrixRequired')}</p>
            )}
          </fieldset>
        )}
      />

      <FormField
        control={form.control}
        name="features"
        label={t('survey.features')}
        description={t('survey.featuresHint')}
        render={({ field }) => (
          <CheckboxGroup
            value={field.value}
            onChange={field.onChange}
            options={FEATURES.map((f) => ({ value: f, label: t(`survey.featureOptions.${f}`) }))}
            selectAllLabel={t('survey.selectAll')}
            orientation="horizontal"
          />
        )}
      />

      <FormField
        control={form.control}
        name="comment"
        label={t('survey.comment')}
        render={({ field, id }) => (
          <TextareaWithCounter
            id={id}
            maxLength={500}
            rows={4}
            placeholder={t('survey.commentPlaceholder')}
            {...field}
          />
        )}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={submit.isPending}>
          {submit.isPending && <Spinner />} {t('survey.submit')}
        </Button>
      </div>
    </form>
  );
}
