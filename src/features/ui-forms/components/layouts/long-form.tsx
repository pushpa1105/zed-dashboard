import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { useDemoSubmit } from '@/features/ui-forms/api/ui-forms-api';
import { DatePicker } from '@/shared/components/forms/date-picker';
import { FileDropzone } from '@/shared/components/forms/file-dropzone';
import { PhoneInput } from '@/shared/components/forms/phone-input';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Progress } from '@/shared/ui/progress';
import { Spinner } from '@/shared/ui/spinner';

const schema = z.object({
  firstName: z.string().trim().min(1, 'validation.required'),
  lastName: z.string().trim().min(1, 'validation.required'),
  birthDate: z.date({ message: 'validation.required' }),
  email: z.string().trim().email('validation.email'),
  phone: z.object({
    country: z.string(),
    number: z.string().min(6, 'validation.required'),
  }),
  street: z.string().trim().min(1, 'validation.required'),
  city: z.string().trim().min(1, 'validation.required'),
  company: z.string().trim().min(1, 'validation.required'),
  jobTitle: z.string().trim().min(1, 'validation.required'),
  startDate: z.date({ message: 'validation.required' }),
  consent: z.literal(true, { message: 'ui-forms:longForm.consentRequired' }),
});
type LongValues = z.input<typeof schema>;

const SECTIONS = [
  { id: 'personal', fields: ['firstName', 'lastName', 'birthDate'] },
  { id: 'contact', fields: ['email', 'phone'] },
  { id: 'address', fields: ['street', 'city'] },
  { id: 'employment', fields: ['company', 'jobTitle', 'startDate'] },
  { id: 'documents', fields: [] },
  { id: 'review', fields: ['consent'] },
] as const;

const filled = (v: unknown): boolean =>
  v instanceof Date ||
  v === true ||
  (typeof v === 'string' && v.trim().length > 0) ||
  (typeof v === 'object' &&
    v !== null &&
    'number' in v &&
    filled((v as { number: string }).number));

/**
 * Long form with a sticky section index: the index highlights the section in
 * view, ticks completed sections and shows overall progress.
 */
export function LongForm() {
  const { t } = useTranslation('ui-forms');
  const prefix = useId().replace(/:/g, '');
  const form = useForm<LongValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: { country: 'US', number: '' },
      street: '',
      city: '',
      company: '',
      jobTitle: '',
    },
  });
  const values = useWatch({ control: form.control });
  const [active, setActive] = useState<string>(SECTIONS[0].id);
  const submit = useDemoSubmit({
    onSuccess: () => notify.success(t('longForm.submitted')),
  });

  const required = SECTIONS.flatMap((s) => s.fields);
  const done = required.filter((f) => filled(values[f as keyof LongValues])).length;
  const sectionDone = (fields: readonly string[]) =>
    fields.length > 0 && fields.every((f) => filled(values[f as keyof LongValues]));

  useEffect(() => {
    // Not available in some test or embedded environments: the index then just won't track.
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible[0]) setActive(visible[0].target.id.replace(`${prefix}-`, ''));
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(`${prefix}-${s.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [prefix]);

  const text = (name: keyof LongValues, autoComplete?: string) => (
    <FormField
      control={form.control}
      name={name}
      label={t(`longForm.fields.${name as 'firstName'}`)}
      required
      render={({ field, id, invalid }) => (
        <Input
          id={id}
          autoComplete={autoComplete}
          aria-invalid={invalid}
          {...field}
          value={(field.value as string) ?? ''}
        />
      )}
    />
  );

  const section = (id: (typeof SECTIONS)[number]['id'], children: ReactNode) => (
    <section
      id={`${prefix}-${id}`}
      className="scroll-mt-24 space-y-5 border-b pb-8 last:border-b-0"
    >
      <div>
        <h3 className="text-base font-semibold">{t(`longForm.sections.${id}`)}</h3>
        <p className="text-sm text-muted-foreground">{t(`longForm.hints.${id}`)}</p>
      </div>
      {children}
    </section>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
      <aside className="h-fit space-y-4 lg:sticky lg:top-24">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('longForm.progress')}</span>
            <span className="tabular-nums">
              {done}/{required.length}
            </span>
          </div>
          <Progress value={(done / required.length) * 100} />
        </div>
        <nav className="space-y-0.5" aria-label={t('longForm.index')}>
          {SECTIONS.map((s, i) => {
            const complete = sectionDone(s.fields);
            return (
              <a
                key={s.id}
                href={`#${prefix}-${s.id}`}
                aria-current={active === s.id ? 'location' : undefined}
                className={cn(
                  'flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  active === s.id && 'bg-muted font-medium text-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-full border text-[0.6875rem] tabular-nums',
                    complete && 'border-success bg-success text-success-foreground',
                  )}
                >
                  {complete ? <Check className="size-3" /> : i + 1}
                </span>
                {t(`longForm.sections.${s.id}`)}
              </a>
            );
          })}
        </nav>
      </aside>

      <form
        noValidate
        onSubmit={form.handleSubmit((v) => submit.mutate(v as Record<string, unknown>))}
        className="space-y-8"
      >
        {section(
          'personal',
          <div className="grid gap-5 sm:grid-cols-2">
            {text('firstName', 'given-name')}
            {text('lastName', 'family-name')}
            <FormField
              control={form.control}
              name="birthDate"
              label={t('longForm.fields.birthDate')}
              required
              render={({ field, id, invalid }) => (
                <DatePicker
                  id={id}
                  value={field.value ?? null}
                  onChange={field.onChange}
                  invalid={invalid}
                  dropdowns
                />
              )}
            />
          </div>,
        )}
        {section(
          'contact',
          <div className="grid gap-5 sm:grid-cols-2">
            {text('email', 'email')}
            <FormField
              control={form.control}
              name="phone"
              label={t('longForm.fields.phone')}
              required
              render={({ field, id, invalid }) => (
                <PhoneInput
                  id={id}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={invalid}
                />
              )}
            />
          </div>,
        )}
        {section(
          'address',
          <div className="grid gap-5 sm:grid-cols-2">
            {text('street', 'street-address')}
            {text('city', 'address-level2')}
          </div>,
        )}
        {section(
          'employment',
          <div className="grid gap-5 sm:grid-cols-2">
            {text('company', 'organization')}
            {text('jobTitle', 'organization-title')}
            <FormField
              control={form.control}
              name="startDate"
              label={t('longForm.fields.startDate')}
              required
              render={({ field, id, invalid }) => (
                <DatePicker
                  id={id}
                  value={field.value ?? null}
                  onChange={field.onChange}
                  invalid={invalid}
                />
              )}
            />
          </div>,
        )}
        {section(
          'documents',
          <FileDropzone
            multiple
            maxFiles={3}
            title={t('longForm.dropTitle')}
            hint={t('longForm.dropHint')}
          />,
        )}
        {section(
          'review',
          <div className="space-y-5">
            <dl className="grid gap-x-6 gap-y-3 rounded-lg bg-muted/40 p-4 text-sm sm:grid-cols-2">
              {(['firstName', 'lastName', 'email', 'company', 'jobTitle', 'city'] as const).map(
                (k) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{t(`longForm.fields.${k}`)}</dt>
                    <dd className="truncate font-medium">{(values[k] as string) || '—'}</dd>
                  </div>
                ),
              )}
            </dl>
            <FormField
              control={form.control}
              name="consent"
              render={({ field, id }) => (
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id={id}
                    checked={field.value === true}
                    onCheckedChange={(c) => field.onChange(c === true)}
                  />
                  <Label htmlFor={id} className="leading-snug font-normal">
                    {t('longForm.consent')}
                  </Label>
                </div>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={submit.isPending}>
                {submit.isPending && <Spinner />} {t('longForm.submit')}
              </Button>
            </div>
          </div>,
        )}
      </form>
    </div>
  );
}
