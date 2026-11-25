import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { BrandLogo } from '@/core/brand/components/brand-logo';
import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { notify } from '@/core/notify/notify';
import { Link } from '@/core/router/router';
import { PasswordInput } from '@/shared/components/forms/password-input';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Spinner } from '@/shared/ui/spinner';

import { BackToGallery, Divider, FieldMessage, SocialButtons } from '../components/template-kit';
import { pagesRoutes } from '../routes';

const schema = z.object({
  name: z.string().min(2),
  company: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
  terms: z.boolean().refine((accepted) => accepted),
});
type Values = z.infer<typeof schema>;

/** Abstract product illustration: stacked cards and a chart, drawn with tokens. */
function Illustration() {
  return (
    <svg viewBox="0 0 320 150" className="mx-auto w-full max-w-xs" aria-hidden>
      <rect x="40" y="18" width="240" height="120" rx="14" className="fill-primary/10" />
      <rect x="62" y="34" width="120" height="88" rx="10" className="fill-card stroke-border" />
      <rect x="76" y="48" width="44" height="6" rx="3" className="fill-muted-foreground/30" />
      <rect x="76" y="62" width="70" height="10" rx="3" className="fill-foreground/80" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={i}
          x={78 + i * 19}
          y={110 - [18, 26, 20, 34, 30][i]!}
          width="11"
          height={[18, 26, 20, 34, 30][i]}
          rx="3"
          className={i === 3 ? 'fill-primary' : 'fill-primary/30'}
        />
      ))}
      <rect x="190" y="46" width="72" height="34" rx="10" className="fill-card stroke-border" />
      <circle cx="207" cy="63" r="8" className="fill-chart-2/70" />
      <rect x="221" y="57" width="32" height="5" rx="2.5" className="fill-muted-foreground/30" />
      <rect x="221" y="66" width="22" height="5" rx="2.5" className="fill-foreground/70" />
      <rect x="190" y="88" width="72" height="34" rx="10" className="fill-card stroke-border" />
      <circle cx="207" cy="105" r="8" className="fill-chart-3/70" />
      <rect x="221" y="99" width="32" height="5" rx="2.5" className="fill-muted-foreground/30" />
      <rect x="221" y="108" width="18" height="5" rx="2.5" className="fill-foreground/70" />
    </svg>
  );
}

/** Auth template 2: sign-up card with an illustration on a tinted canvas. */
export default function AuthIllustratedPage() {
  const { t } = useTranslation('pages');
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', company: '', email: '', password: '', terms: false },
  });
  const { errors, isSubmitting } = form.formState;

  return (
    <div className="flex min-h-svh flex-col items-center bg-muted/50 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_60%)] px-4 py-10">
      <Head title={t('templates.authIllustrated.title')} />
      <BrandLogo />
      <div className="mt-8 w-full max-w-md overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b bg-muted/40 px-8 pt-8 pb-4">
          <Illustration />
        </div>
        <div className="space-y-6 p-8">
          <div className="space-y-1.5 text-center">
            <h1 className="text-xl font-semibold tracking-tight">{t('auth.illustrated.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('auth.illustrated.subtitle')}</p>
          </div>
          <SocialButtons
            className="sm:grid-cols-2 [&>*:last-child]:sm:col-span-2"
            onPick={(provider) => notify.info(t('auth.toast.provider', { provider }))}
          />
          <Divider>{t('auth.orEmail')}</Divider>
          <form
            noValidate
            className="grid gap-4"
            onSubmit={form.handleSubmit(async (values) => {
              await new Promise((resolve) => setTimeout(resolve, 700));
              notify.success(t('auth.toast.created'), { description: values.email });
            })}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ill-name">{t('auth.fields.name')}</Label>
                <Input id="ill-name" aria-invalid={!!errors.name} {...form.register('name')} />
                <FieldMessage>{errors.name && t('auth.errors.required')}</FieldMessage>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ill-company">{t('auth.fields.company')}</Label>
                <Input
                  id="ill-company"
                  aria-invalid={!!errors.company}
                  {...form.register('company')}
                />
                <FieldMessage>{errors.company && t('auth.errors.required')}</FieldMessage>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ill-email">{t('auth.fields.workEmail')}</Label>
              <Input
                id="ill-email"
                type="email"
                aria-invalid={!!errors.email}
                {...form.register('email')}
              />
              <FieldMessage>{errors.email && t('auth.errors.email')}</FieldMessage>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ill-password">{t('auth.fields.password')}</Label>
              <PasswordInput
                id="ill-password"
                showStrength
                aria-invalid={!!errors.password}
                showLabel={t('auth.show')}
                hideLabel={t('auth.hide')}
                {...form.register('password')}
              />
              <FieldMessage>{errors.password && t('auth.errors.password')}</FieldMessage>
            </div>
            <Controller
              control={form.control}
              name="terms"
              render={({ field }) => (
                <label className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    className="mt-0.5"
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                    aria-invalid={!!errors.terms}
                  />
                  <span>{t('auth.illustrated.terms')}</span>
                </label>
              )}
            />
            <FieldMessage>{errors.terms && t('auth.errors.terms')}</FieldMessage>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Spinner />} {t('auth.illustrated.submit')}
            </Button>
          </form>
        </div>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        {t('auth.haveAccount')}{' '}
        <Link
          to={pagesRoutes.authSplit.href()}
          className="font-medium text-foreground hover:underline"
        >
          {t('auth.signIn')}
        </Link>
      </p>
      <BackToGallery />
    </div>
  );
}
