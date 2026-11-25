import { zodResolver } from '@hookform/resolvers/zod';
import { Bell, Building2, Mail, Rocket, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { AsyncAutocomplete } from '@/shared/components/forms/async-autocomplete';
import { AvatarUpload } from '@/shared/components/forms/avatar-upload';
import { CheckboxCards, RadioCards } from '@/shared/components/forms/choice-cards';
import { ColorPicker } from '@/shared/components/forms/color-picker';
import { Combobox } from '@/shared/components/forms/combobox';
import { CurrencyInput } from '@/shared/components/forms/currency-input';
import { DatePicker } from '@/shared/components/forms/date-picker';
import { InputWithAddons } from '@/shared/components/forms/input-with-addons';
import { MultiSelect } from '@/shared/components/forms/multi-select';
import { PasswordInput } from '@/shared/components/forms/password-input';
import { PhoneInput } from '@/shared/components/forms/phone-input';
import { SwitchRow } from '@/shared/components/forms/switch-row';
import { TagInput } from '@/shared/components/forms/tag-input';
import { TextareaWithCounter } from '@/shared/components/forms/textarea-with-counter';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Spinner } from '@/shared/ui/spinner';

import { uiFormsApi, useCreateCompany } from '../api/ui-forms-api';

import { INDUSTRIES, TEAM_OPTIONS } from './sample-data';

const optionSchema = z.object({ value: z.string(), label: z.string() });

const schema = z
  .object({
    companyName: z
      .string()
      .trim()
      .min(2, 'ui-forms:validation.companyName')
      .max(60, 'validation.tooLong'),
    website: z
      .string()
      .trim()
      .regex(/^([\w-]+\.)+[a-z]{2,}(\/.*)?$/i, 'ui-forms:validation.website')
      .or(z.literal('')),
    industry: z.string({ error: 'validation.required' }).min(1, 'validation.required'),
    size: z.string({ error: 'validation.required' }).min(1, 'validation.required'),
    description: z.string().max(280, 'validation.tooLong'),
    country: optionSchema.nullable(),
    phone: z.object({ country: z.string(), number: z.string() }),
    foundedOn: z.date().nullable(),
    budget: z.number().nullable(),
    teams: z.array(z.string()).min(1, 'ui-forms:validation.teams'),
    keywords: z.array(z.string()).max(8),
    brandColor: z.string(),
    addons: z.array(z.string()),
    adminEmail: z.email('validation.email'),
    password: z
      .string()
      .min(8, 'ui-forms:validation.password')
      .regex(/\d/, 'ui-forms:validation.password'),
    weeklyDigest: z.boolean(),
    securityAlerts: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (!values.country)
      ctx.addIssue({ code: 'custom', path: ['country'], message: 'validation.required' });
  });

type CompanyValues = z.infer<typeof schema>;

const DEFAULTS: CompanyValues = {
  companyName: '',
  website: '',
  industry: '',
  size: '',
  description: '',
  country: null,
  phone: { country: 'US', number: '' },
  foundedOn: null,
  budget: null,
  teams: [],
  keywords: [],
  // theme-exempt: form value, not UI color
  brandColor: '#6250d6',
  addons: ['sso'],
  adminEmail: '',
  password: '',
  weeklyDigest: true,
  securityAlerts: true,
};

const searchCountries = async (q: string, signal: AbortSignal) =>
  (await uiFormsApi.searchCountries(q, signal)).map((c) => ({
    value: c.code,
    label: c.name,
    description: c.region,
  }));

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-6 border-b py-8 first:pt-0 last:border-b-0 lg:grid-cols-[16rem_1fr] lg:gap-10">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid max-w-2xl gap-5">{children}</div>
    </section>
  );
}

/**
 * A realistic, fully validated form: zod schema + react-hook-form, with
 * every field rendered through `FormField`. A sticky bar appears while the
 * form has unsaved changes.
 */
export function CompanyForm() {
  const { t } = useTranslation('ui-forms');
  const form = useForm<CompanyValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
    mode: 'onTouched',
  });
  const { control, formState } = form;
  const password = useWatch({ control, name: 'password' });

  const create = useCreateCompany({
    meta: { successMessage: t('company.saved') },
    onSuccess: (_, values) => form.reset(values as CompanyValues),
  });

  const onSubmit = form.handleSubmit((values) =>
    create.mutate({ ...values, foundedOn: values.foundedOn?.toISOString() ?? null }),
  );

  const sizes = (['1-10', '11-50', '51-200', '201+'] as const).map((value) => ({
    value,
    title: t(`company.sizes.${value}`),
    description: t('company.sizeHint', { range: value }),
    icon: <Users />,
  }));

  const addons = [
    {
      value: 'sso',
      title: t('company.addons.sso'),
      description: t('company.addons.ssoHint'),
      icon: <ShieldCheck />,
      meta: '$4/seat',
    },
    {
      value: 'ai',
      title: t('company.addons.ai'),
      description: t('company.addons.aiHint'),
      icon: <Sparkles />,
      meta: '$12/mo',
    },
    {
      value: 'priority',
      title: t('company.addons.priority'),
      description: t('company.addons.priorityHint'),
      icon: <Rocket />,
      meta: '$29/mo',
    },
  ];

  return (
    <form onSubmit={(e) => void onSubmit(e)} noValidate className="relative">
      <FormSection
        title={t('company.sections.company')}
        description={t('company.sections.companyHint')}
      >
        <AvatarUpload
          fallback="AC"
          shape="rounded"
          uploadLabel={t('company.logo')}
          removeLabel={t('company.removeLogo')}
          hint={t('company.logoHint')}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={control}
            name="companyName"
            label={t('company.name')}
            required
            render={({ field, id, invalid }) => (
              <Input
                {...field}
                id={id}
                aria-invalid={invalid}
                placeholder="Acme Inc."
                autoComplete="organization"
              />
            )}
          />
          <FormField
            control={control}
            name="website"
            label={t('company.website')}
            render={({ field, id, invalid }) => (
              <InputWithAddons
                {...field}
                id={id}
                invalid={invalid}
                prepend="https://"
                placeholder="acme.com"
              />
            )}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={control}
            name="industry"
            label={t('company.industry')}
            required
            render={({ field, id, invalid }) => (
              <Combobox
                id={id}
                invalid={invalid}
                options={INDUSTRIES}
                value={field.value || null}
                onChange={(v) => {
                  field.onChange(v ?? '');
                  field.onBlur();
                }}
                placeholder={t('company.industryPlaceholder')}
                creatable
              />
            )}
          />
          <FormField
            control={control}
            name="foundedOn"
            label={t('company.founded')}
            render={({ field, id }) => (
              <DatePicker
                id={id}
                value={field.value}
                onChange={field.onChange}
                dropdowns
                disabledDays={{ after: new Date() }}
              />
            )}
          />
        </div>
        <FormField
          control={control}
          name="size"
          label={t('company.size')}
          required
          render={({ field }) => (
            <RadioCards
              options={sizes}
              columns={4}
              value={field.value || null}
              onChange={field.onChange}
              aria-label={t('company.size')}
            />
          )}
        />
        <FormField
          control={control}
          name="description"
          label={t('company.about')}
          description={t('company.aboutHint')}
          render={({ field, id, invalid }) => (
            <TextareaWithCounter
              {...field}
              id={id}
              aria-invalid={invalid}
              maxLength={280}
              hardLimit={false}
              rows={3}
            />
          )}
        />
      </FormSection>

      <FormSection
        title={t('company.sections.contact')}
        description={t('company.sections.contactHint')}
      >
        <FormField
          control={control}
          name="country"
          label={t('company.country')}
          required
          render={({ field, id, invalid }) => (
            <AsyncAutocomplete
              id={id}
              invalid={invalid}
              fetchOptions={searchCountries}
              value={field.value}
              onChange={(v) => {
                field.onChange(v ? { value: v.value, label: v.label } : null);
              }}
              placeholder={t('company.countryPlaceholder')}
            />
          )}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={control}
            name="phone"
            label={t('company.phone')}
            render={({ field, id }) => (
              <PhoneInput id={id} value={field.value} onChange={field.onChange} />
            )}
          />
          <FormField
            control={control}
            name="budget"
            label={t('company.budget')}
            description={t('company.budgetHint')}
            render={({ field, id, invalid }) => (
              <CurrencyInput
                id={id}
                invalid={invalid}
                value={field.value}
                onChange={field.onChange}
                placeholder="0.00"
              />
            )}
          />
        </div>
      </FormSection>

      <FormSection title={t('company.sections.team')} description={t('company.sections.teamHint')}>
        <FormField
          control={control}
          name="teams"
          label={t('company.teams')}
          required
          render={({ field, id, invalid }) => (
            <MultiSelect
              id={id}
              invalid={invalid}
              options={TEAM_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              selectAll
              placeholder={t('company.teamsPlaceholder')}
            />
          )}
        />
        <FormField
          control={control}
          name="keywords"
          label={t('company.keywords')}
          description={t('company.keywordsHint')}
          render={({ field, id, invalid }) => (
            <TagInput
              id={id}
              invalid={invalid}
              value={field.value}
              onChange={field.onChange}
              max={8}
              lowercase
            />
          )}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={control}
            name="adminEmail"
            label={t('company.adminEmail')}
            required
            render={({ field, id, invalid }) => (
              <InputWithAddons
                {...field}
                id={id}
                type="email"
                invalid={invalid}
                leading={<Mail />}
                placeholder="admin@acme.com"
                autoComplete="email"
              />
            )}
          />
          <FormField
            control={control}
            name="password"
            label={t('company.password')}
            required
            render={({ field, id, invalid }) => (
              <PasswordInput
                {...field}
                id={id}
                aria-invalid={invalid}
                autoComplete="new-password"
                showStrength={!!password}
              />
            )}
          />
        </div>
      </FormSection>

      <FormSection
        title={t('company.sections.branding')}
        description={t('company.sections.brandingHint')}
      >
        <FormField
          control={control}
          name="brandColor"
          label={t('company.brandColor')}
          render={({ field, id }) => (
            <ColorPicker
              id={id}
              value={field.value}
              onChange={field.onChange}
              className="max-w-48"
            />
          )}
        />
        <FormField
          control={control}
          name="addons"
          label={t('company.addonsLabel')}
          render={({ field }) => (
            <CheckboxCards
              options={addons}
              columns={1}
              value={field.value}
              onChange={field.onChange}
              aria-label={t('company.addonsLabel')}
            />
          )}
        />
      </FormSection>

      <FormSection
        title={t('company.sections.notifications')}
        description={t('company.sections.notificationsHint')}
      >
        <div className="divide-y rounded-xl border">
          <FormField
            control={control}
            name="weeklyDigest"
            render={({ field }) => (
              <SwitchRow
                className="p-4"
                icon={<Bell />}
                label={t('company.digest')}
                description={t('company.digestHint')}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <FormField
            control={control}
            name="securityAlerts"
            render={({ field }) => (
              <SwitchRow
                className="p-4"
                icon={<ShieldCheck />}
                label={t('company.security')}
                description={t('company.securityHint')}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
      </FormSection>

      <div
        className={cn(
          'sticky bottom-4 z-10 mt-2 flex items-center justify-between gap-3 rounded-xl border bg-card/95 px-4 py-3 shadow-lg backdrop-blur transition-all',
          formState.isDirty
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-2 opacity-0',
        )}
        aria-hidden={!formState.isDirty}
      >
        <p className="flex items-center gap-2 text-sm">
          <Building2 className="size-4 text-muted-foreground" />
          {t('company.unsaved', { count: Object.keys(formState.dirtyFields).length })}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => form.reset(DEFAULTS)}
            disabled={create.isPending}
          >
            {t('company.discard')}
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending && <Spinner />}
            {t('company.save')}
          </Button>
        </div>
      </div>
      {!formState.isDirty && (
        <p className="pt-2 text-right text-xs text-muted-foreground">{t('company.hint')}</p>
      )}
    </form>
  );
}
