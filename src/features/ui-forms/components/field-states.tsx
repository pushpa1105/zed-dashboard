import { AtSign, Check, Globe, Loader2, Percent, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { DatePicker } from '@/shared/components/forms/date-picker';
import { InputWithAddons } from '@/shared/components/forms/input-with-addons';
import { MultiSelect } from '@/shared/components/forms/multi-select';
import { NumberInput } from '@/shared/components/forms/number-input';
import { Rating } from '@/shared/components/forms/rating';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { Checkbox } from '@/shared/ui/checkbox';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Switch } from '@/shared/ui/switch';
import { Textarea } from '@/shared/ui/textarea';

import { Demo, ShowcaseGrid } from './showcase';

const TAKEN = ['admin', 'acme', 'support', 'hannah'];

/** Username field that checks availability as you type (debounced). */
function UsernameCheck() {
  const { t } = useTranslation('ui-forms');
  const [value, setValue] = useState('');
  const debounced = useDebounce(value.trim().toLowerCase(), 400);
  const [checked, setChecked] = useState<{ name: string; free: boolean } | null>(null);

  useEffect(() => {
    if (debounced.length < 3) return;
    const id = window.setTimeout(
      () => setChecked({ name: debounced, free: !TAKEN.includes(debounced) }),
      350,
    );
    return () => window.clearTimeout(id);
  }, [debounced]);

  const tooShort = value.trim().length > 0 && value.trim().length < 3;
  const pending =
    !tooShort && value.trim().length >= 3 && checked?.name !== value.trim().toLowerCase();
  const result = !pending && !tooShort && value ? checked : null;

  return (
    <Field data-invalid={tooShort || result?.free === false}>
      <FieldLabel htmlFor="username-check">{t('states.username')}</FieldLabel>
      <InputWithAddons
        id="username-check"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        leading={<AtSign />}
        invalid={tooShort || result?.free === false}
        trailing={
          pending ? (
            <Loader2 className="animate-spin" />
          ) : result ? (
            result.free ? (
              <Check className="text-success" />
            ) : (
              <X className="text-destructive" />
            )
          ) : null
        }
        placeholder="hannah"
      />
      {tooShort && <FieldError>{t('states.usernameShort')}</FieldError>}
      {result && !result.free && (
        <FieldError>{t('states.usernameTaken', { name: result.name })}</FieldError>
      )}
      {result?.free && (
        <FieldDescription className="text-success">{t('states.usernameFree')}</FieldDescription>
      )}
      {!value && (
        <FieldDescription>{t('states.usernameHint', { names: TAKEN.join(', ') })}</FieldDescription>
      )}
    </Field>
  );
}

/** Inline validation patterns and the disabled / read-only / error states of every input. */
export function FieldStates() {
  const { t } = useTranslation('ui-forms');
  const [email, setEmail] = useState('hannah@acme');
  const emailInvalid = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <ShowcaseGrid>
      <Demo title={t('states.inlineTitle')} description={t('states.inlineText')}>
        <UsernameCheck />
        <Field data-invalid={emailInvalid}>
          <FieldLabel htmlFor="email-inline">{t('states.email')}</FieldLabel>
          <Input
            id="email-inline"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={emailInvalid}
          />
          {emailInvalid ? (
            <FieldError>{t('states.emailError')}</FieldError>
          ) : (
            <FieldDescription>{t('states.emailOk')}</FieldDescription>
          )}
        </Field>
      </Demo>

      <Demo title={t('states.disabledTitle')} description={t('states.disabledText')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-disabled>
            <FieldLabel>{t('states.text')}</FieldLabel>
            <Input disabled defaultValue="Acme Inc." />
          </Field>
          <Field>
            <FieldLabel>{t('states.readOnly')}</FieldLabel>
            <Input readOnly defaultValue="org_8f2k1x" className="bg-muted/50 font-mono" />
          </Field>
          <Field>
            <FieldLabel>{t('states.select')}</FieldLabel>
            <MultiSelect
              disabled
              options={[{ value: 'a', label: 'Design' }]}
              defaultValue={['a']}
            />
          </Field>
          <Field>
            <FieldLabel>{t('states.date')}</FieldLabel>
            <DatePicker disabled defaultValue={new Date(2026, 0, 12)} />
          </Field>
          <Field>
            <FieldLabel>{t('states.number')}</FieldLabel>
            <NumberInput readOnly defaultValue={42} suffix={<Percent className="size-3.5" />} />
          </Field>
          <Field>
            <FieldLabel>{t('states.rating')}</FieldLabel>
            <Rating readOnly defaultValue={3.5} allowHalf showValue />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <label className="flex items-center gap-2 opacity-60">
            <Checkbox disabled defaultChecked /> {t('states.checkbox')}
          </label>
          <label className="flex items-center gap-2 opacity-60">
            <Switch disabled defaultChecked /> {t('states.switch')}
          </label>
        </div>
      </Demo>

      <Demo title={t('states.errorTitle')} description={t('states.errorText')} wide>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field data-invalid>
            <FieldLabel>{t('states.website')}</FieldLabel>
            <InputWithAddons invalid defaultValue="acme" leading={<Globe />} />
            <FieldError>{t('validation.website')}</FieldError>
          </Field>
          <Field data-invalid>
            <FieldLabel>{t('states.teams')}</FieldLabel>
            <MultiSelect invalid options={[{ value: 'a', label: 'Design' }]} />
            <FieldError>{t('validation.teams')}</FieldError>
          </Field>
          <Field data-invalid>
            <FieldLabel>{t('states.seats')}</FieldLabel>
            <NumberInput invalid defaultValue={0} min={0} />
            <FieldError>{t('states.seatsError')}</FieldError>
          </Field>
          <Field data-invalid>
            <FieldLabel>{t('states.notes')}</FieldLabel>
            <Textarea aria-invalid rows={1} defaultValue="?" />
            <FieldError>{t('states.notesError')}</FieldError>
          </Field>
        </div>
      </Demo>
    </ShowcaseGrid>
  );
}
