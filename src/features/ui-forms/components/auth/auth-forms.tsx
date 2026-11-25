import { zodResolver } from '@hookform/resolvers/zod';
import {
  Copy,
  Download,
  Fingerprint,
  KeyRound,
  Lock,
  LogIn,
  MailCheck,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  UserPlus,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { OtpInput } from '@/shared/components/forms/otp-input';
import { PasswordInput } from '@/shared/components/forms/password-input';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Spinner } from '@/shared/ui/spinner';

import { AuthCard, AuthDivider } from './auth-card';
import { useAuthAction } from './use-auth-action';

const done = (message: string) => () => notify.success(message);

/* ---------------------------------------------------------------- sign in */

const signInSchema = z.object({
  email: z.string().trim().email('validation.email'),
  password: z.string().min(1, 'validation.required'),
  remember: z.boolean(),
});

export function SignInCard() {
  const { t } = useTranslation('ui-forms');
  const action = useAuthAction('sign-in', done(t('auth.toasts.signedIn')));
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '', remember: true },
  });
  return (
    <AuthCard
      icon={LogIn}
      title={t('auth.signIn.title')}
      description={t('auth.signIn.description')}
      error={action.error}
      footer={
        <>
          {t('auth.signIn.noAccount')}{' '}
          <button
            type="button"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t('auth.signIn.create')}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline">
          <KeyRound /> {t('auth.sso')}
        </Button>
        <Button type="button" variant="outline">
          <Fingerprint /> {t('auth.passkey')}
        </Button>
      </div>
      <AuthDivider>{t('auth.orEmail')}</AuthDivider>
      <form noValidate onSubmit={form.handleSubmit((v) => action.run(v))} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          label={t('auth.email')}
          render={({ field, id, invalid }) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              aria-invalid={invalid}
              {...field}
            />
          )}
        />
        <FormField
          control={form.control}
          name="password"
          label={t('auth.password')}
          render={({ field, id, invalid }) => (
            <PasswordInput
              id={id}
              autoComplete="current-password"
              aria-invalid={invalid}
              {...field}
            />
          )}
        />
        <FormField
          control={form.control}
          name="remember"
          render={({ field, id }) => (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="order-last ml-auto text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {t('auth.forgotLink')}
              </button>
              <Checkbox
                id={id}
                checked={field.value}
                onCheckedChange={(c) => field.onChange(c === true)}
              />
              <Label htmlFor={id} className="font-normal">
                {t('auth.signIn.remember')}
              </Label>
            </div>
          )}
        />
        <Button type="submit" className="w-full" disabled={action.pending}>
          {action.pending && <Spinner />} {t('auth.signIn.submit')}
        </Button>
      </form>
    </AuthCard>
  );
}

/* ---------------------------------------------------------------- sign up */

const signUpSchema = z.object({
  name: z.string().trim().min(2, 'validation.required'),
  email: z.string().trim().email('validation.email'),
  password: z.string().min(8, 'ui-forms:auth.passwordRule'),
  terms: z.literal(true, { message: 'ui-forms:auth.termsRequired' }),
});

export function SignUpCard() {
  const { t } = useTranslation('ui-forms');
  const action = useAuthAction('sign-up', done(t('auth.toasts.signedUp')));
  const form = useForm<z.input<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  });
  return (
    <AuthCard
      icon={UserPlus}
      title={t('auth.signUp.title')}
      description={t('auth.signUp.description')}
      error={action.error}
    >
      <form noValidate onSubmit={form.handleSubmit((v) => action.run(v))} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          label={t('auth.name')}
          render={({ field, id, invalid }) => (
            <Input id={id} autoComplete="name" aria-invalid={invalid} {...field} />
          )}
        />
        <FormField
          control={form.control}
          name="email"
          label={t('auth.workEmail')}
          render={({ field, id, invalid }) => (
            <Input id={id} type="email" autoComplete="email" aria-invalid={invalid} {...field} />
          )}
        />
        <FormField
          control={form.control}
          name="password"
          label={t('auth.password')}
          render={({ field, id, invalid }) => (
            <PasswordInput
              id={id}
              autoComplete="new-password"
              showStrength
              aria-invalid={invalid}
              {...field}
            />
          )}
        />
        <FormField
          control={form.control}
          name="terms"
          render={({ field, id }) => (
            <div className="flex items-start gap-2">
              <Checkbox
                id={id}
                checked={field.value === true}
                onCheckedChange={(c) => field.onChange(c === true)}
              />
              <Label htmlFor={id} className="leading-snug font-normal text-muted-foreground">
                {t('auth.signUp.terms')}
              </Label>
            </div>
          )}
        />
        <Button type="submit" className="w-full" disabled={action.pending}>
          {action.pending && <Spinner />} {t('auth.signUp.submit')}
        </Button>
      </form>
    </AuthCard>
  );
}

/* ---------------------------------------------------------------- forgot */

export function ForgotPasswordCard() {
  const { t } = useTranslation('ui-forms');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<{ email: string }>({
    resolver: zodResolver(z.object({ email: z.string().trim().email('validation.email') })),
    defaultValues: { email: '' },
  });
  const action = useAuthAction('forgot', () => setSentTo(form.getValues('email')));

  if (sentTo) {
    return (
      <AuthCard
        icon={MailCheck}
        title={t('auth.forgot.sentTitle')}
        description={t('auth.forgot.sentDescription', { email: sentTo })}
      >
        <Button variant="outline" onClick={() => setSentTo(null)}>
          <RotateCcw /> {t('auth.forgot.tryAnother')}
        </Button>
      </AuthCard>
    );
  }
  return (
    <AuthCard
      icon={KeyRound}
      title={t('auth.forgot.title')}
      description={t('auth.forgot.description')}
      error={action.error}
    >
      <form noValidate onSubmit={form.handleSubmit((v) => action.run(v))} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          label={t('auth.email')}
          render={({ field, id, invalid }) => (
            <Input id={id} type="email" autoComplete="email" aria-invalid={invalid} {...field} />
          )}
        />
        <Button type="submit" className="w-full" disabled={action.pending}>
          {action.pending && <Spinner />} {t('auth.forgot.submit')}
        </Button>
      </form>
    </AuthCard>
  );
}

/* ---------------------------------------------------------------- reset */

const resetSchema = z
  .object({
    password: z.string().min(8, 'ui-forms:auth.passwordRule'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'ui-forms:auth.passwordsMismatch',
  });

export function ResetPasswordCard() {
  const { t } = useTranslation('ui-forms');
  const action = useAuthAction('reset', done(t('auth.toasts.reset')));
  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirm: '' },
  });
  return (
    <AuthCard
      icon={Lock}
      title={t('auth.reset.title')}
      description={t('auth.reset.description')}
      error={action.error}
    >
      <form noValidate onSubmit={form.handleSubmit((v) => action.run(v))} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          label={t('auth.newPassword')}
          render={({ field, id, invalid }) => (
            <PasswordInput
              id={id}
              autoComplete="new-password"
              showStrength
              aria-invalid={invalid}
              {...field}
            />
          )}
        />
        <FormField
          control={form.control}
          name="confirm"
          label={t('auth.confirmPassword')}
          render={({ field, id, invalid }) => (
            <PasswordInput id={id} autoComplete="new-password" aria-invalid={invalid} {...field} />
          )}
        />
        <Button type="submit" className="w-full" disabled={action.pending}>
          {action.pending && <Spinner />} {t('auth.reset.submit')}
        </Button>
      </form>
    </AuthCard>
  );
}

/* ---------------------------------------------------------------- OTP */

export function OtpCard() {
  const { t } = useTranslation('ui-forms');
  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(30);
  const action = useAuthAction('otp', done(t('auth.toasts.verified')));

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  return (
    <AuthCard
      icon={Smartphone}
      title={t('auth.otp.title')}
      description={t('auth.otp.description', { phone: '+1 (415) •••-••42' })}
      error={action.error}
    >
      <div className="flex justify-center">
        <OtpInput
          length={6}
          groupSize={3}
          value={code}
          onChange={(v) => {
            setCode(v);
            action.reset();
          }}
          onComplete={(v) => action.run({ code: v })}
          invalid={!!action.error}
          autoFocus={false}
        />
      </div>
      <Button
        className="w-full"
        disabled={code.length < 6 || action.pending}
        onClick={() => action.run({ code })}
      >
        {action.pending && <Spinner />} {t('auth.otp.submit')}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {seconds > 0 ? (
          t('auth.otp.resendIn', { seconds })
        ) : (
          <button
            type="button"
            className="font-medium text-foreground hover:underline"
            onClick={() => setSeconds(30)}
          >
            {t('auth.otp.resend')}
          </button>
        )}
      </p>
      <p className="text-center text-xs text-muted-foreground">{t('auth.otp.hint')}</p>
    </AuthCard>
  );
}

/* ---------------------------------------------------------------- 2FA setup */

/** Deterministic QR-looking cells (decorative placeholder; use a QR library for real codes). */
function qrCells(seed: string): boolean[] {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const cells: boolean[] = [];
  for (let i = 0; i < 21 * 21; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const x = i % 21;
    const y = Math.floor(i / 21);
    const finder = (cx: number, cy: number) => x >= cx && x < cx + 7 && y >= cy && y < cy + 7;
    if (finder(0, 0) || finder(14, 0) || finder(0, 14)) {
      const lx = x >= 14 ? x - 14 : x;
      const ly = y >= 14 ? y - 14 : y;
      cells.push(
        lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4),
      );
    } else cells.push((h >> 16) % 2 === 0);
  }
  return cells;
}

function QrPlaceholder({ seed }: { seed: string }) {
  const cells = useMemo(() => qrCells(seed), [seed]);
  return (
    <svg
      viewBox="0 0 21 21"
      // theme-exempt: scanners need dark modules on a light background
      className="size-40 rounded-lg border bg-white fill-black p-2"
      role="img"
      aria-label="QR code"
    >
      {cells.map((on, i) =>
        on ? <rect key={i} x={i % 21} y={Math.floor(i / 21)} width={1} height={1} /> : null,
      )}
    </svg>
  );
}

const BACKUP_CODES = ['7KQ2-9XWD', 'M4TR-2PLE', 'Z8NB-6HVC', 'Q3JD-1RYS', 'P9KF-5GWA', 'H2XL-8TMN'];

export function TwoFactorSetupCard() {
  const { t } = useTranslation('ui-forms');
  const [step, setStep] = useState<'scan' | 'codes'>('scan');
  const [code, setCode] = useState('');
  const action = useAuthAction('two-factor', () => setStep('codes'));
  const secret = 'JBSW Y3DP EHPK 3PXP';

  if (step === 'codes') {
    return (
      <AuthCard
        icon={ShieldCheck}
        title={t('auth.twoFactor.codesTitle')}
        description={t('auth.twoFactor.codesDescription')}
      >
        <ol className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/40 p-3 font-mono text-sm">
          {BACKUP_CODES.map((c) => (
            <li key={c} className="text-center tabular-nums">
              {c}
            </li>
          ))}
        </ol>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() =>
              void navigator.clipboard
                ?.writeText(BACKUP_CODES.join('\n'))
                .then(() => notify.success(t('auth.twoFactor.copied')))
            }
          >
            <Copy /> {t('auth.twoFactor.copy')}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob([BACKUP_CODES.join('\n')], { type: 'text/plain' }),
              );
              const a = Object.assign(document.createElement('a'), {
                href: url,
                download: 'backup-codes.txt',
              });
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download /> {t('auth.twoFactor.download')}
          </Button>
        </div>
        <Button
          onClick={() => {
            notify.success(t('auth.toasts.twoFactor'));
            setStep('scan');
            setCode('');
            action.reset();
          }}
        >
          {t('auth.twoFactor.finish')}
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      icon={ShieldCheck}
      title={t('auth.twoFactor.title')}
      description={t('auth.twoFactor.description')}
      error={action.error}
    >
      <div className="flex flex-col items-center gap-3">
        <QrPlaceholder seed={secret} />
        <p className="text-center text-xs text-muted-foreground">{t('auth.twoFactor.manual')}</p>
        <code className="rounded-md bg-muted px-2.5 py-1 font-mono text-sm tracking-wider">
          {secret}
        </code>
      </div>
      <div className="flex justify-center">
        <OtpInput
          length={6}
          groupSize={3}
          value={code}
          onChange={setCode}
          invalid={!!action.error}
          autoFocus={false}
        />
      </div>
      <Button disabled={code.length < 6 || action.pending} onClick={() => action.run({ code })}>
        {action.pending && <Spinner />} {t('auth.twoFactor.verify')}
      </Button>
    </AuthCard>
  );
}

/* ---------------------------------------------------------------- lock screen */

export function LockScreenCard() {
  const { t } = useTranslation('ui-forms');
  const [password, setPassword] = useState('');
  const action = useAuthAction('unlock', done(t('auth.toasts.unlocked')));
  return (
    <AuthCard
      title={t('auth.lock.title', { name: 'Hannah' })}
      description={t('auth.lock.description')}
      error={action.error}
    >
      <div className="flex flex-col items-center gap-2">
        <Avatar className="size-16">
          <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
            HM
          </AvatarFallback>
        </Avatar>
        <p className="text-sm font-medium">Hannah Morgan</p>
        <p className="text-xs text-muted-foreground">
          {t('auth.lock.lockedAt', { time: '14:32' })}
        </p>
      </div>
      <form
        noValidate
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          action.run({ password });
        }}
      >
        <PasswordInput
          aria-label={t('auth.password')}
          autoComplete="current-password"
          placeholder={t('auth.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" className="w-full" disabled={!password || action.pending}>
          {action.pending ? <Spinner /> : <Lock />} {t('auth.lock.unlock')}
        </Button>
      </form>
      <p className="text-center text-xs text-muted-foreground">{t('auth.lock.hint')}</p>
    </AuthCard>
  );
}
